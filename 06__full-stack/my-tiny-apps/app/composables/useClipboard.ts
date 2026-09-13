export function useClipboard(defaultTimeout = 2000) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const copy = async (text: string, timeoutMs = defaultTimeout): Promise<boolean> => {
    if (!text) return false

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        copied.value = true
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          copied.value = false
        }, timeoutMs)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      return false
    }
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    copied,
    isCopied: readonly(copied),
    copy,
  }
}
