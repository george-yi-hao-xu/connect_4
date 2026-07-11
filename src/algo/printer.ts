const TERMINAL_ID = "terminal";

export function write_ln(v: string) {
    // console.log(v);

    // browser env
    // if (typeof window !== "undefined" && typeof document !== "undefined") {
    //     const ter = document.getElementById(TERMINAL_ID);
    //     if (!ter) return;

    //     const line = document.createElement("div");
    //     line.className = "log-line";
    //     line.textContent = v;
    //     ter.appendChild(line);
    //     ter.scrollTop = ter.scrollHeight;
    // }
}

export function debug_log(v: string) {
    // console.log(v);
}
