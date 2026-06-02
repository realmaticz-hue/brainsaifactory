declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
    export function set(key: string, value: string): void;
    export function remove(key: string): void;
    export function toObject(): Record<string, string>;
  }

  export function writeFile(tempPath: string, wav2lipVideo: Uint8Array<ArrayBufferLike>) {
    throw new Error("Function not implemented.");
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
