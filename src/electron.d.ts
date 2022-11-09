interface Window {
  electron: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, data: any) => void
    receive: (channel: string, func: CallableFunction) => void
  }
}
