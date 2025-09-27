# Komra System Data Collection Agent

Cross-platform agent for collecting comprehensive system information from Windows, Linux, and macOS machines.

## Quick Start

### 1. Web Interface
Visit the System Data Collector in your dashboard to collect data from the current machine:
```
http://localhost:3000/system-data-collector
```

### 2. Command Line Agent
Run the standalone agent on any machine:

```bash
# Install dependencies (if not using the web interface)
npm install node-fetch

# Run the agent
node scripts/komra-agent.js --apiEndpoint http://your-server:3000/api/system-data
```

## Supported Platforms

### Windows
- **Versions**: Windows 10, Windows 11, Windows Server 2016+
- **Package Managers**: MSI, Windows Features
- **Data Sources**: PowerShell, WMI, Registry
- **Privileges**: Requires PowerShell execution policy allowing scripts

### Linux
- **Distributions**: RHEL, CentOS, Rocky Linux, Ubuntu, Debian, Fedora
- **Package Managers**: RPM, DEB, Snap
- **Data Sources**: systemctl, rpm, dpkg, /proc, /sys
- **Privileges**: Standard user (some system info may require sudo)

### macOS
- **Versions**: macOS 10.15+
- **Package Managers**: Homebrew, App Store, DMG installations
- **Data Sources**: launchctl, brew, /Applications
- **Privileges**: Standard user

## Data Collected

### System Information
- Hostname and IP addresses
- Operating system type and version
- CPU architecture and specifications
- Memory and disk usage
- Network interfaces
- Running services/processes
- Environment detection (prod/staging/dev)

### Software Inventory
- Installed packages with versions
- Package managers and sources
- Installation dates (where available)
- Vendor/maintainer information
- Package types (MSI, RPM, DEB, etc.)

## Installation Methods

### Method 1: Web-Based Collection
1. Access the System Data Collector component
2. Click "Collect System Data"
3. Data is automatically stored in your Supabase database

### Method 2: Standalone Agent
1. Copy `scripts/komra-agent.js` to target machines
2. Install Node.js on target machines
3. Run the agent with your API endpoint

### Method 3: Scheduled Collection
Set up automated collection using:

**Windows (Task Scheduler):**
```cmd
schtasks /create /tn "Komra Agent" /tr "node C:\path\to\komra-agent.js" /sc daily /st 02:00
```

**Linux/macOS (Cron):**
```bash
# Add to crontab
0 2 * * * /usr/bin/node /path/to/komra-agent.js
```

## Configuration

### Agent Configuration File
The agent creates `~/.komra-agent.json` for persistent configuration:

```json
{
  "apiEndpoint": "https://your-komra-server.com/api/system-data",
  "apiKey": "your-api-key-here",
  "scanInterval": 3600,
  "enableVulnerabilityScanning": true
}
```

### Environment Variables
```bash
export KOMRA_API_KEY="your-api-key"
export KOMRA_API_ENDPOINT="https://your-server.com/api/system-data"
```

## API Integration

### Collect Data
```bash
curl -X POST http://localhost:3000/api/system-data \
  -H "Content-Type: application/json"
```

### Retrieve Data
```bash
# Get all endpoints
curl http://localhost:3000/api/system-data

# Get specific hostname
curl "http://localhost:3000/api/system-data?hostname=server1"
```

## Platform-Specific Commands

### Windows PowerShell Commands Used
```powershell
# Installed programs
Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*

# Windows features
Get-WindowsOptionalFeature -Online

# System information
Get-ComputerInfo
Get-WmiObject -Class Win32_OperatingSystem

# Services
Get-Service | Where-Object {$_.Status -eq "Running"}
```

### Linux Commands Used
```bash
# RPM-based systems
rpm -qa --queryformat '%{NAME}|%{VERSION}|%{VENDOR}|%{INSTALLTIME}\n'

# DEB-based systems
dpkg-query -W -f='${Package}|${Version}|${Maintainer}\n'

# System information
uname -a
cat /etc/os-release
systemctl list-units --type=service --state=running
```

### macOS Commands Used
```bash
# Homebrew packages
brew list --versions

# Installed applications
find /Applications -maxdepth 2 -name "*.app" -type d

# System services
launchctl list
```

## Security Considerations

1. **Privileges**: Agent runs with standard user privileges
2. **Data Transmission**: Uses HTTPS for secure data transfer
3. **API Authentication**: Supports API key authentication
4. **Local Storage**: Configuration stored in user home directory
5. **Logging**: Activity logged to `~/.komra-agent.log`

## Troubleshooting

### Common Issues

**Windows PowerShell Execution Policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux Package Manager Not Found:**
- Ensure system has either `rpm` or `dpkg` installed
- Check if running on supported distribution

**macOS Homebrew Not Found:**
- Install Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- Or run without Homebrew (will collect App Store apps only)

**Network Connectivity:**
- Verify API endpoint is accessible
- Check firewall settings
- Ensure correct port (default: 3000)

### Debug Mode
Run with verbose logging:
```bash
DEBUG=1 node scripts/komra-agent.js
```

## Integration with Vulnerability Scanning

The collected data integrates with your vulnerability assessment pipeline:

1. **Package Inventory** → CVE Database Lookup
2. **Version Information** → Vulnerability Matching
3. **System Configuration** → Security Baseline Comparison
4. **Service Discovery** → Attack Surface Analysis

## Next Steps

1. **Deploy agents** to your infrastructure endpoints
2. **Set up scheduled scans** for continuous monitoring
3. **Configure vulnerability scanning** against collected data
4. **Create dashboards** for security oversight
5. **Set up alerts** for critical vulnerabilities

For advanced configuration and enterprise deployment, see the full documentation.