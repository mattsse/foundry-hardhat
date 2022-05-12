import { spawn } from "child_process";
import debug from "debug";
import { getAnvilCommand } from "@foundry-rs/easy-foundryup";
import { AnvilOptions } from "./anvil-service";

const log = debug("hardhat::plugin::anvil::spawn");

export class AnvilServer {
  private readonly _anvil: any;
  private readonly _options: AnvilOptions;

  private constructor(options: AnvilOptions, anvil: any) {
    this._options = options;
    this._anvil = anvil;
  }

  public static async launch(options: any): Promise<AnvilServer> {
    log("Launching anvil");
    let anvil: any;

    if (options.launch) {
      const anvilPath = options.path ?? (await getAnvilCommand());
      const args = [];
      if (options.port) {
        args.push("--port", options.port);
      }
      if (options.totalAccounts) {
        args.push("--accounts", options.totalAccounts);
      }
      if (options.mnemonic) {
        args.push("--mnemonic", options.mnemonic);
      }
      if (options.defaultBalanceEther) {
        args.push("--balance", options.defaultBalanceEther);
      }
      if (options.hdPath) {
        args.push("--derivation-path", options.hdPath);
      }
      if (options.silent) {
        args.push("--silent", options.silent);
      }
      if (options.blockTime) {
        args.push("--block-time", options.blockTime);
      }
      if (options.gasLimit) {
        args.push("--gas-limit", options.gasLimit);
      }
      if (options.gasPrice) {
        args.push("--gas-price", options.gasPrice);
      }
      if (options.chainId) {
        args.push("--chain-id", options.chainId);
      }
      if (options.forkurl) {
        args.push("--fork-url", options.forkurl);
        if (options.forkBlockNumber) {
          args.push("--fork-block-number", options.forkBlockNumber);
        }
      }
      if (options.noStorageCaching) {
        args.push("--no-storage-caching");
      }
      if (options.hardfork) {
        args.push("--hardfork", options.hardfork);
      }

      anvil = spawn(anvilPath, args);

      let serverReady = false;
      anvil.stdout.on("data", (data: any) => {
        const output = data.toString();
        if (output.includes("Listening")) {
          serverReady = true;
        }
        log(`${data}`);
      });

      anvil.stderr.on("data", (data: any) => {
        log(`${data}`);
      });

      anvil.on("close", (code: any) => {
        log(`anvil child process exited with code ${code}`);
      });

      process.on("exit", function () {
        anvil.kill();
      });

      // wait until server ready
      const retries = 5;
      for (let i = 0; i < retries; i++) {
        if (serverReady) {
          log("anvil server ready");
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return new AnvilServer(options, anvil);
  }

  public kill() {
    this._anvil?.kill();
  }
}
