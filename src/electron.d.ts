interface Window {
  electron: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any) => void
    receive: (channel: string, func: CallableFunction) => void
    remove: (channel: string, func: CallableFunction) => void
  }
}

type CyalumeSettings = {
  grow: boolean
  colorType: "single" | "crypton" | "follow"
  singleColor: string
}
