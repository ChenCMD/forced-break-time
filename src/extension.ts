import { TextDecoder, TextEncoder } from 'util';
import { commands, Disposable, ExtensionContext, Uri, window, workspace } from 'vscode';
import { Config } from './types/Config';
import { listenInput, showError } from './util/vscodeWrapper';

let globalStorageUri: Uri;
let intervalID: NodeJS.Timeout;

export function activate(context: ExtensionContext): void {

    globalStorageUri = context.globalStorageUri;
    getBreakDate();

    const disposable: Disposable[] = [];

    disposable.push(commands.registerCommand('forced-break-time.config', setBreakDate));

    disposable.push(workspace.onDidOpenTextDocument(closeDoc));

    context.subscriptions.push(...disposable);

    intervalID = setInterval(closeDoc, 10000);
}

export function deactivate(): void {
    clearInterval(intervalID);
}

function closeDoc() {
    if (isBreakDate() && window.activeTextEditor) {
        commands.executeCommand('workbench.action.closeAllEditors');
        showError('この時間にファイルを開くことは許されないよ！休憩しろ！');
    }
}

function isBreakDate() {
    try {
        const { before, after } = data;
        const hour = new Date().getHours();
        return (before <= hour && hour < after) || (before <= hour + 24 && hour + 24 < after);
    } catch {
        return false;
    }
}

let data: Config;
async function getBreakDate(): Promise<Config> {
    data = JSON.parse(new TextDecoder().decode(await workspace.fs.readFile(globalStorageUri)));
    return data;
}

async function setBreakDate(): Promise<void> {
    try {
        if (isBreakDate()) {
            showError('この時間にconfigを開くことは許されないよ！休憩しろ！');
            return;
        }
        const newDate = await listenInput('H-Hの形式の休憩時間', v => /^\s*[0-2]?[0-9]\s*-\s*[0-2]?[0-9]\s*$/.test(v) ? undefined : 'H-Hの形式じゃないよ・・・。', `${data.before}-${data.after}`);
        const splitedDate = newDate.split('-').map(v => Number.parseInt(v.trim()));
        const before = splitedDate[0] < 24 ? splitedDate[0] : splitedDate[0] - 24;
        let after = splitedDate[1] < 24 ? splitedDate[1] : splitedDate[1] - 24;
        after = after < before ? after + 24 : after;
        data = { before, after };
        closeDoc();
        await writeBreakDate();
    } catch {
        return;
    }
}

async function writeBreakDate(): Promise<void> {
    await workspace.fs.writeFile(globalStorageUri, new TextEncoder().encode(JSON.stringify(data)));
}