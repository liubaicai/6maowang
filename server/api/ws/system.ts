import { cpus, totalmem, freemem, loadavg, uptime } from 'node:os'
import type { Peer } from 'crossws'

// 存储所有连接的客户端
const clients = new Map<string, Peer>()

// 广播定时器
let broadcastTimer: ReturnType<typeof setInterval> | null = null

// 获取实时系统信息（轻量版）
function getRealtimeSystemInfo() {
  // CPU 信息
  const cpuInfo = cpus()
  const cpuCores = cpuInfo.length
  
  // CPU 使用率
  const load = loadavg()
  let cpuUsage = 0
  if (load[0] > 0) {
    cpuUsage = Math.min(100, Math.round((load[0] / cpuCores) * 100))
  }
  
  // 内存信息
  const totalMemory = totalmem()
  const freeMemory = freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUsage = Math.round((usedMemory / totalMemory) * 100)
  
  // 系统运行时间
  const uptimeSeconds = uptime()
  
  return {
    cpu: {
      usage: cpuUsage,
      load: load.map(l => l.toFixed(2)),
    },
    memory: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      usage: memoryUsage,
    },
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds,
    timestamp: Date.now(),
  }
}

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

// 广播系统信息给所有客户端
function broadcastSystemInfo() {
  if (clients.size === 0) return
  
  const info = getRealtimeSystemInfo()
  const message = JSON.stringify(info)
  
  for (const [id, peer] of clients) {
    try {
      peer.send(message)
    } catch (error) {
      console.error('[WebSocket] 发送失败:', id, error)
      clients.delete(id)
    }
  }
}

// 启动广播定时器
function startBroadcast() {
  if (broadcastTimer) return
  // 每 2 秒广播一次系统信息
  broadcastTimer = setInterval(broadcastSystemInfo, 2000)
}

// 停止广播定时器
function stopBroadcast() {
  if (broadcastTimer) {
    clearInterval(broadcastTimer)
    broadcastTimer = null
  }
}

export default defineWebSocketHandler({
  open(peer) {
    console.log('[WebSocket] 客户端连接:', peer.id)
    clients.set(peer.id, peer)
    
    // 立即发送一次系统信息
    try {
      const info = getRealtimeSystemInfo()
      peer.send(JSON.stringify(info))
    } catch (error) {
      console.error('[WebSocket] 初始发送失败:', error)
    }
    
    // 启动广播
    startBroadcast()
  },
  
  message(peer, message) {
    // 可以处理客户端发来的消息，比如 ping/pong
    try {
      const text = typeof message === 'string' ? message : message.text()
      const data = JSON.parse(text)
      if (data.type === 'ping') {
        peer.send(JSON.stringify({ type: 'pong' }))
      }
    } catch {
      // 忽略无效消息
    }
  },
  
  close(peer) {
    console.log('[WebSocket] 客户端断开:', peer.id)
    clients.delete(peer.id)
    
    // 如果没有客户端了，停止广播
    if (clients.size === 0) {
      stopBroadcast()
    }
  },
  
  error(peer, error) {
    console.error('[WebSocket] 错误:', peer.id, error)
    clients.delete(peer.id)
  },
})
