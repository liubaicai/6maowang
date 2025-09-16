import { cpus, totalmem, freemem, loadavg, uptime, hostname, platform, arch, release, type } from 'node:os'
import { networkInterfaces } from 'node:os'
import { execSync } from 'node:child_process'

export default defineEventHandler(() => {
  // CPU 信息
  const cpuInfo = cpus()
  const cpuModel = cpuInfo[0]?.model || 'Unknown'
  const cpuCores = cpuInfo.length
  
  // 计算 CPU 使用率（基于 load average）
  // Windows 上 loadavg 返回 [0, 0, 0]，所以用其他方式估算
  const load = loadavg()
  let cpuUsage = 0
  if (load[0] > 0) {
    cpuUsage = Math.min(100, Math.round((load[0] / cpuCores) * 100))
  } else {
    // Windows 平台：基于 CPU times 估算（简单版本）
    cpuUsage = 0 // Windows 上暂时显示 0
  }

  // 获取系统发行版信息
  const osInfo = getOsInfo()
  
  // 内存信息
  const totalMemory = totalmem()
  const freeMemory = freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUsage = Math.round((usedMemory / totalMemory) * 100)
  
  // 系统运行时间
  const uptimeSeconds = uptime()
  const uptimeFormatted = formatUptime(uptimeSeconds)
  
  // 网络接口
  const nets = networkInterfaces()
  const networkInfo: { name: string; ip: string }[] = []
  
  for (const [name, interfaces] of Object.entries(nets)) {
    if (interfaces) {
      for (const net of interfaces) {
        // 跳过内部接口和 IPv6
        if (!net.internal && net.family === 'IPv4') {
          networkInfo.push({
            name,
            ip: net.address,
          })
        }
      }
    }
  }
  
  return {
    hostname: hostname(),
    platform: platform(),
    arch: arch(),
    osInfo,
    cpu: {
      model: cpuModel,
      cores: cpuCores,
      usage: cpuUsage,
      load: load.map(l => l.toFixed(2)),
    },
    memory: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      usage: memoryUsage,
    },
    uptime: uptimeFormatted,
    uptimeSeconds,
    network: networkInfo,
  }
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  
  return parts.length > 0 ? parts.join(' ') : '刚刚启动'
}

function getOsInfo(): { distro: string; kernel: string } {
  const os = platform()
  const kernelVersion = release()
  
  try {
    if (os === 'linux') {
      // 尝试读取 /etc/os-release 获取发行版信息
      try {
        const osRelease = execSync('cat /etc/os-release 2>/dev/null', { encoding: 'utf-8' })
        const prettyName = osRelease.match(/PRETTY_NAME="(.+)"/)?.[1] || 'Linux'
        return {
          distro: prettyName,
          kernel: kernelVersion,
        }
      } catch {
        // 回退到 uname
        const uname = execSync('uname -r', { encoding: 'utf-8' }).trim()
        return {
          distro: 'Linux',
          kernel: uname,
        }
      }
    } else if (os === 'darwin') {
      // macOS
      try {
        const swVers = execSync('sw_vers -productVersion', { encoding: 'utf-8' }).trim()
        return {
          distro: `macOS ${swVers}`,
          kernel: kernelVersion,
        }
      } catch {
        return {
          distro: 'macOS',
          kernel: kernelVersion,
        }
      }
    } else if (os === 'win32') {
      // Windows
      try {
        const ver = execSync('ver', { encoding: 'utf-8' }).trim()
        // 提取版本号
        const versionMatch = ver.match(/\[Version (.+)\]/)
        return {
          distro: 'Windows',
          kernel: versionMatch ? versionMatch[1] : kernelVersion,
        }
      } catch {
        return {
          distro: 'Windows',
          kernel: kernelVersion,
        }
      }
    }
  } catch {
    // 忽略错误
  }
  
  return {
    distro: type(),
    kernel: kernelVersion,
  }
}
