interface Window {
  electron: {
    send: (channel: string, data: any) => void;
    receive: (channel: string, func: CallableFunction) => void;
  };
}
