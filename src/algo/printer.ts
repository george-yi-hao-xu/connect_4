type LogSubscriber = (line: string) => void;

const subscribers: LogSubscriber[] = [];

export function subscribe_logs(callback: LogSubscriber): () => void {
    // push it
    subscribers.push(callback);

    // for react to offload
    return () => {
        const index = subscribers.indexOf(callback);
        if (index !== -1) subscribers.splice(index, 1);
    };
}

export function write_ln(v: string) {
    subscribers.forEach((cb) => cb(v));
}

export function debug_log(v: string) {
    subscribers.forEach((cb) => cb(v));
}
