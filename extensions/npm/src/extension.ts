import "reflect-metadata";
import * as vscode from "vscode";
import { bootstrap } from "foundation/App/bootstrap";
import routes from "./routes";
import { Bus } from "foundation/Bus/Bus";
import { WebviewProviderEvents } from "foundation/Webview/WebviewProvider";
import { ClientManager } from "./clients/ClientManager";
import { NpmClient } from "./clients/NpmClient";
import { YarnClient } from "./clients/YarnClient";
import { PnpmClient } from "./clients/PnpmClient";
import { openClosestPackageJson } from "./commands/openClosestPackageJson";

export function activate(context: vscode.ExtensionContext) {
  const app = bootstrap({
    context,
    routes,
    viewId: "iridium.npm",
  });

  app.bind(NpmClient).toSelf();
  app.bind(YarnClient).toSelf();
  app.bind(PnpmClient).toSelf();
  app.bind(ClientManager).toSelf();

  app
    .get(Bus)
    .on(WebviewProviderEvents.registered, (webviewView: vscode.WebviewView) => {
      if (vscode.workspace.workspaceFolders) {
        let watcher =
          vscode.workspace.createFileSystemWatcher("**/package.json");
        const notify = () =>
          webviewView.webview.postMessage({ type: "PACKAGE_JSON_UPDATED" });
        watcher.onDidChange(notify);
        watcher.onDidDelete(notify);
        watcher.onDidCreate(notify);
        context.subscriptions.push(watcher);
      }
      if (vscode.workspace.workspaceFolders) {
        let watcher = vscode.workspace.createFileSystemWatcher(
          "**/.unimportedrc.json"
        );
        const notify = () =>
          webviewView.webview.postMessage({ type: "UNIMPORTEDRC_UPDATED" });
        watcher.onDidChange(notify);
        watcher.onDidDelete(notify);
        watcher.onDidCreate(notify);
        context.subscriptions.push(watcher);
      }
      vscode.workspace.onDidChangeConfiguration(() => {
        webviewView.webview.postMessage({ type: "CONFIG_UPDATED" });
      });
    });

  vscode.commands.registerCommand(
    "iridium.openClosestPackageJson",
    openClosestPackageJson
  );
}

export function deactivate() {}
