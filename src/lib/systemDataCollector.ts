import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface SystemPackage {
  name: string;
  version: string;
  vendor?: string;
  package_type: 'msi' | 'rpm' | 'deb' | 'exe' | 'dmg' | 'pkg' | 'brew' | 'npm' | 'pip';
  installed_date?: string;
  description?: string;
}

export interface SystemInfo {
  hostname: string;
  ip_address: string;
  os_type: 'Windows 10' | 'Windows Server' | 'Red Hat Linux' | 'Ubuntu' | 'CentOS' | 'macOS' | 'Other';
  os_version: string;
  architecture: string;
  cpu_info: string;
  memory_total: number;
  disk_usage: object;
  network_interfaces: object[];
  running_services: string[];
  environment: 'production' | 'staging' | 'development';
}

export interface MachineData {
  endpoint: SystemInfo;
  packages: SystemPackage[];
  vulnerabilities?: any[];
  last_scan: string;
}

class SystemDataCollector {
  private platform: string;

  constructor() {
    this.platform = os.platform();
  }

  async collectSystemData(): Promise<MachineData> {
    const systemInfo = await this.getSystemInfo();
    const packages = await this.getInstalledPackages();
    
    return {
      endpoint: systemInfo,
      packages,
      last_scan: new Date().toISOString()
    };
  }

  private async getSystemInfo(): Promise<SystemInfo> {
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

  private async getInstalledPackages(): Promise<SystemPackage[]> {
    switch (this.platform) {
      case 'win32':
        return this.getWindowsPackages();
      case 'linux':
        return this.getLinuxPackages();
      case 'darwin':
        return this.getMacPackages();
      default:
        return [];
    }
  }

  private async getWindowsPackages(): Promise<SystemPackage[]> {
    const packages: SystemPackage[] = [];
    
    try {
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

      // Get Windows features
      const { stdout: featuresOutput } = await execAsync(`
        Get-WindowsOptionalFeature -Online | 
        Where-Object {$_.State -eq "Enabled"} | 
        Select-Object FeatureName, State | 
        ConvertTo-Json
      `, { shell: 'powershell' });
      
      const features = JSON.parse(featuresOutput);
      const featuresArray = Array.isArray(features) ? features : [features];
      
      for (const feature of featuresArray) {
        packages.push({
          name: feature.FeatureName,
          version: 'enabled',
          package_type: 'msi',
          description: 'Windows Feature'
        });
      }

    } catch (error) {
      console.error('Error collecting Windows packages:', error);
    }
    
    return packages;
  }

  private async getLinuxPackages(): Promise<SystemPackage[]> {
    const packages: SystemPackage[] = [];
    
    try {
      // Try RPM-based systems (Red Hat, CentOS, Fedora)
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
      } catch {
        // Try DEB-based systems (Debian, Ubuntu)
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
        } catch {
          console.warn('Neither RPM nor DEB package managers found');
        }
      }

      // Try to get snap packages
      try {
        const { stdout: snapOutput } = await execAsync(`snap list --unicode=never`);
        const snapLines = snapOutput.trim().split('\n').slice(1); // Skip header
        
        for (const line of snapLines) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            packages.push({
              name: parts[0],
              version: parts[1],
              package_type: 'deb',
              description: 'Snap package'
            });
          }
        }
      } catch {
        // Snap not available
      }

    } catch (error) {
      console.error('Error collecting Linux packages:', error);
    }
    
    return packages;
  }

  private async getMacPackages(): Promise<SystemPackage[]> {
    const packages: SystemPackage[] = [];
    
    try {
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
      } catch {
        // Homebrew not available
      }

      // Get installed applications from /Applications
      try {
        const { stdout: appsOutput } = await execAsync(`find /Applications -maxdepth 2 -name "*.app" -type d`);
        const appPaths = appsOutput.trim().split('\n');
        
        for (const appPath of appPaths) {
          const appName = appPath.split('/').pop()?.replace('.app', '');
          if (appName) {
            try {
              const { stdout: versionOutput } = await execAsync(`defaults read "${appPath}/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "unknown"`);
              packages.push({
                name: appName,
                version: versionOutput.trim(),
                package_type: 'dmg',
                description: 'macOS Application'
              });
            } catch {
              packages.push({
                name: appName,
                version: 'unknown',
                package_type: 'dmg',
                description: 'macOS Application'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error getting macOS applications:', error);
      }

    } catch (error) {
      console.error('Error collecting macOS packages:', error);
    }
    
    return packages;
  }

  private async getDiskUsage(): Promise<object> {
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

  private async getRunningServices(): Promise<string[]> {
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

  private getOSType(): SystemInfo['os_type'] {
    const platform = os.platform();
    const release = os.release();
    
    switch (platform) {
      case 'win32':
        return release.startsWith('10.') ? 'Windows 10' : 'Windows Server';
      case 'linux':
        // Try to detect specific Linux distribution
        try {
          const fs = require('fs');
          if (fs.existsSync('/etc/redhat-release')) {
            return 'Red Hat Linux';
          } else if (fs.existsSync('/etc/ubuntu-release') || fs.existsSync('/etc/lsb-release')) {
            return 'Ubuntu';
          } else if (fs.existsSync('/etc/centos-release')) {
            return 'CentOS';
          }
        } catch {}
        return 'Red Hat Linux'; // Default for Linux
      case 'darwin':
        return 'macOS';
      default:
        return 'Other';
    }
  }

  private getPrimaryNetworkInterface(interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>) {
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

  private detectEnvironment(): 'production' | 'staging' | 'development' {
    const hostname = os.hostname().toLowerCase();
    
    if (hostname.includes('prod') || hostname.includes('production')) {
      return 'production';
    } else if (hostname.includes('stag') || hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'development';
    }
  }
}

export default SystemDataCollector;