#!/usr/bin/env node

/**
 * Komra System Data Collection Agent
 * Cross-platform agent for collecting system information
 * Supports Windows, Linux, and macOS
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class KomraAgent {
  constructor(options = {}) {
    // Priority: CLI arg > env var > production default
    // For local testing: set KOMRA_API_ENDPOINT=http://localhost:3000/api/agent/ingest
    this.apiEndpoint = options.apiEndpoint || process.env.KOMRA_API_ENDPOINT || 'https://komrasec.com/api/agent/ingest';
    this.apiKey = options.apiKey || process.env.KOMRA_API_KEY;
    this.platform = os.platform();
    this.configPath = path.join(os.homedir(), '.komra-agent.json');
    this.logPath = path.join(os.homedir(), '.komra-agent.log');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
      fs.appendFileSync(this.logPath, logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.apiEndpoint = config.apiEndpoint || this.apiEndpoint;
        this.apiKey = config.apiKey || this.apiKey;
        return config;
      }
    } catch (error) {
      this.log(`Warning: Failed to load config: ${error.message}`);
    }
    return {};
  }

  async saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.log('Configuration saved successfully');
    } catch (error) {
      this.log(`Error: Failed to save config: ${error.message}`);
    }
  }

  async collectSystemData() {
    this.log('Starting system data collection...');
    
    try {
      const systemInfo = await this.getSystemInfo();
      const packages = await this.getInstalledPackages();
      
      const machineData = {
        endpoint: systemInfo,
        packages,
        last_scan: new Date().toISOString()
      };

      this.log(`Collected data for ${systemInfo.hostname}:`);
      this.log(`  - OS: ${systemInfo.os_type} ${systemInfo.os_version}`);
      this.log(`  - Packages: ${packages.length}`);
      this.log(`  - Services: ${systemInfo.running_services.length}`);

      return machineData;
    } catch (error) {
      this.log(`Error collecting system data: ${error.message}`);
      throw error;
    }
  }

  async getSystemInfo() {
    const networkInterfaces = os.networkInterfaces();
    const primaryInterface = this.getPrimaryNetworkInterface(networkInterfaces);
    
    return {
      hostname: os.hostname(),
      ip_address: primaryInterface?.address || 'unknown',
      os_type: this.getOSType(),
      os_version: os.release(),
      architecture: os.arch(),
      cpu_info: os.cpus()[0]?.model || 'unknown',
      memory_total: os.totalmem(),
      disk_usage: await this.getDiskUsage(),
      network_interfaces: Object.entries(networkInterfaces).map(([name, interfaces]) => ({
        name,
        interfaces: interfaces?.map(iface => ({
          address: iface.address,
          family: iface.family,
          internal: iface.internal
        })) || []
      })),
      running_services: await this.getRunningServices(),
      environment: this.detectEnvironment()
    };
  }

  async getInstalledPackages() {
    switch (this.platform) {
      case 'win32':
        return this.getWindowsPackages();
      case 'linux':
        return this.getLinuxPackages();
      case 'darwin':
        return this.getMacPackages();
      default:
        this.log(`Warning: Unsupported platform: ${this.platform}`);
        return [];
    }
  }

  async getWindowsPackages() {
    const packages = [];
    
    try {
      this.log('Collecting Windows packages...');
      
      // Get installed programs from registry
      const { stdout: registryOutput } = await execAsync(`
        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
        Where-Object {$_.DisplayName} | 
        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | 
        ConvertTo-Json
      `, { shell: 'powershell' });
      
      const registryPrograms = JSON.parse(registryOutput);
      const programsArray = Array.isArray(registryPrograms) ? registryPrograms : [registryPrograms];
      
      for (const program of programsArray) {
        if (program.DisplayName) {
          packages.push({
            name: program.DisplayName,
            version: program.DisplayVersion || 'unknown',
            vendor: program.Publisher,
            package_type: 'msi',
            installed_date: program.InstallDate
          });
        }
      }

    } catch (error) {
      this.log(`Error collecting Windows packages: ${error.message}`);
    }
    
    return packages;
  }

  async getLinuxPackages() {
    const packages = [];
    
    try {
      this.log('Collecting Linux packages...');
      
      // Try RPM-based systems first
      try {
        const { stdout: rpmOutput } = await execAsync(`rpm -qa --queryformat '%{NAME}|%{VERSION}|%{VENDOR}|%{INSTALLTIME}\\n'`);
        const rpmLines = rpmOutput.trim().split('\n');
        
        for (const line of rpmLines) {
          const [name, version, vendor, installTime] = line.split('|');
          if (name && version) {
            packages.push({
              name,
              version,
              vendor: vendor || undefined,
              package_type: 'rpm',
              installed_date: installTime ? new Date(parseInt(installTime) * 1000).toISOString() : undefined
            });
          }
        }
        this.log(`Found ${packages.length} RPM packages`);
      } catch {
        // Try DEB-based systems
        try {
          const { stdout: dpkgOutput } = await execAsync(`dpkg-query -W -f='\\${Package}|\\${Version}|\\${Maintainer}\\n'`);
          const dpkgLines = dpkgOutput.trim().split('\n');
          
          for (const line of dpkgLines) {
            const [name, version, maintainer] = line.split('|');
            if (name && version) {
              packages.push({
                name,
                version,
                vendor: maintainer || undefined,
                package_type: 'deb'
              });
            }
          }
          this.log(`Found ${packages.length} DEB packages`);
        } catch {
          this.log('Warning: Neither RPM nor DEB package managers found');
        }
      }

    } catch (error) {
      this.log(`Error collecting Linux packages: ${error.message}`);
    }
    
    return packages;
  }

  async getMacPackages() {
    const packages = [];
    
    try {
      this.log('Collecting macOS packages...');
      
      // Get Homebrew packages
      try {
        const { stdout: brewOutput } = await execAsync(`brew list --versions`);
        const brewLines = brewOutput.trim().split('\n');
        
        for (const line of brewLines) {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            packages.push({
              name: parts[0],
              version: parts.slice(1).join(' '),
              package_type: 'brew',
              description: 'Homebrew package'
            });
          }
        }
        this.log(`Found ${packages.length} Homebrew packages`);
      } catch {
        this.log('Homebrew not found or not accessible');
      }

      // Get installed applications
      try {
        const { stdout: appsOutput } = await execAsync(`find /Applications -maxdepth 2 -name "*.app" -type d`);
        const appPaths = appsOutput.trim().split('\n');
        
        for (const appPath of appPaths) {
          const appName = appPath.split('/').pop()?.replace('.app', '');
          if (appName) {
            packages.push({
              name: appName,
              version: 'unknown',
              package_type: 'dmg',
              description: 'macOS Application'
            });
          }
        }
        this.log(`Found ${appPaths.length} macOS applications`);
      } catch (error) {
        this.log(`Error getting macOS applications: ${error.message}`);
      }

    } catch (error) {
      this.log(`Error collecting macOS packages: ${error.message}`);
    }
    
    return packages;
  }

  async getDiskUsage() {
    try {
      switch (this.platform) {
        case 'win32':
          const { stdout: winDisk } = await execAsync(`Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json`, { shell: 'powershell' });
          return JSON.parse(winDisk);
        case 'linux':
        case 'darwin':
          const { stdout: unixDisk } = await execAsync(`df -h | grep -E '^/dev/'`);
          return { raw: unixDisk };
        default:
          return {};
      }
    } catch {
      return {};
    }
  }

  async getRunningServices() {
    try {
      switch (this.platform) {
        case 'win32':
          const { stdout: winServices } = await execAsync(`Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object -ExpandProperty Name`, { shell: 'powershell' });
          return winServices.trim().split('\n').filter(Boolean);
        case 'linux':
          const { stdout: linuxServices } = await execAsync(`systemctl list-units --type=service --state=running --no-pager --no-legend | awk '{print $1}'`);
          return linuxServices.trim().split('\n').filter(Boolean);
        case 'darwin':
          const { stdout: macServices } = await execAsync(`launchctl list | grep -v "^-" | awk '{print $3}' | grep -v "^$"`);
          return macServices.trim().split('\n').filter(Boolean);
        default:
          return [];
      }
    } catch {
      return [];
    }
  }

  getOSType() {
    const platform = os.platform();
    const release = os.release();
    
    switch (platform) {
      case 'win32':
        return release.startsWith('10.') ? 'Windows 10' : 'Windows Server';
      case 'linux':
        try {
          if (fs.existsSync('/etc/redhat-release')) {
            return 'Red Hat Linux';
          } else if (fs.existsSync('/etc/ubuntu-release') || fs.existsSync('/etc/lsb-release')) {
            return 'Ubuntu';
          } else if (fs.existsSync('/etc/centos-release')) {
            return 'CentOS';
          }
        } catch {}
        return 'Red Hat Linux';
      case 'darwin':
        return 'macOS';
      default:
        return 'Other';
    }
  }

  getPrimaryNetworkInterface(interfaces) {
    for (const [name, ifaces] of Object.entries(interfaces)) {
      if (ifaces) {
        for (const iface of ifaces) {
          if (!iface.internal && iface.family === 'IPv4') {
            return iface;
          }
        }
      }
    }
    return null;
  }

  detectEnvironment() {
    const hostname = os.hostname().toLowerCase();
    
    if (hostname.includes('prod') || hostname.includes('production')) {
      return 'production';
    } else if (hostname.includes('stag') || hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'development';
    }
  }

  async sendDataToServer(data) {
    this.log('Sending data to Komra server...');
    
    if (!this.apiKey) {
      throw new Error('API key not configured. Set KOMRA_API_KEY environment variable or use --apiKey option');
    }
    
    try {
      const fetch = (await import('node-fetch')).default;
      
      this.log(`Endpoint: ${this.apiEndpoint}`);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || response.statusText}`);
      }

      this.log('✅ Data sent successfully to Komra server');
      this.log(`   - Endpoint ID: ${result.data?.endpoint_id}`);
      this.log(`   - Packages processed: ${result.data?.packages_processed}`);
      if (result.data?.packages_skipped > 0) {
        this.log(`   - Packages skipped: ${result.data?.packages_skipped}`);
      }
      
      return result;
    } catch (error) {
      this.log(`❌ Error sending data to server: ${error.message}`);
      throw error;
    }
  }

  async run() {
    try {
      await this.loadConfig();
      
      this.log('🚀 Komra Agent starting...');
      this.log(`   Platform: ${this.platform}`);
      this.log(`   Hostname: ${os.hostname()}`);
      this.log(`   API Endpoint: ${this.apiEndpoint}`);
      
      const data = await this.collectSystemData();
      const result = await this.sendDataToServer(data);
      
      this.log('✅ Komra Agent completed successfully');
      return result;
    } catch (error) {
      this.log(`❌ Komra Agent failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  const agent = new KomraAgent(options);
  agent.run().catch(console.error);
}

module.exports = KomraAgent;