import { ProgressLocation, QuickPickItem, Uri, window, workspace } from 'vscode';
import { UserCancelledError } from '../types/Error';
import { MessageItemHasId } from '../types/MessageItemHasID';

export function getIndent(path: string): number {
    const config = workspace.getConfiguration('editor.tabSize', Uri.file(path));
    return config.get<number>('tabSize', 4);
}

export async function listenInput(
    message: string, validateInput?: (value: string) => Thenable<string | undefined> | string | undefined, value?: string
): Promise<string> {
    const mes = message ? `${message}を入力` : '';
    const ans = await window.showInputBox({
        value,
        prompt: mes,
        ignoreFocusOut: true,
        validateInput,
        valueSelection: [0, value?.length ?? 0]
    });
    if (ans === undefined) throw new UserCancelledError();
    return ans;
}

export function validater(v: string, validatePattern: RegExp, emptyMessage: string): string | undefined {
    const invalidChar = v.match(validatePattern);
    if (invalidChar) return `${invalidChar.join(', ')}は不明なエスケープ文字です`;
    if (v === '') return emptyMessage;
    return undefined;
}

export interface ListenDirOption {
    canSelectFiles?: boolean;
    canSelectFolders?: boolean;
    canSelectMany?: boolean;
    filters?: { [key: string]: string[]; };
}

export async function listenDir(title: string, openLabel: string, otherOption?: ListenDirOption & {canSelectMany?: false}): Promise<Uri>;
export async function listenDir(title: string, openLabel: string, otherOption?: ListenDirOption & {canSelectMany: true}): Promise<Uri[]>;
export async function listenDir(title: string, openLabel: string, option: ListenDirOption = {}): Promise<Uri | Uri[]> {
    const ans = await window.showOpenDialog({
        canSelectFiles: option.canSelectFiles ?? false,
        canSelectFolders: option.canSelectFolders ?? true,
        canSelectMany: option.canSelectMany ?? false,
        defaultUri: workspace.workspaceFolders?.[0].uri,
        openLabel,
        title,
        filters: option.filters
    }).then(v => option.canSelectMany ? v : v?.[0]);
    if (!ans) throw new UserCancelledError();
    return ans;
}

export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany: false): Promise<T>;
export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany: true): Promise<T[]>;
export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany = true): Promise<T | T[]> {
    const ans = await window.showQuickPick(items, {
        canPickMany,
        ignoreFocusOut: true,
        matchOnDescription: false,
        matchOnDetail: false,
        placeHolder
    });
    if (!ans) throw new UserCancelledError();
    return ans;
}

export async function createProgressBar<T>(
    title: string,
    task: (report: (value: { increment?: number, message?: string }) => void) => Promise<T> | T
): Promise<T> {
    return await window.withProgress<T>({
        location: ProgressLocation.Notification,
        cancellable: false,
        title
    }, async progress => await task((value: { increment?: number, message?: string }) => progress.report(value)));
}

export async function showInfo(message: string, modal?: boolean): Promise<void>;
export async function showInfo(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showInfo(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showInformationMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showInformationMessage(message, { modal });
    return;
}

export async function showWarning(message: string, modal?: boolean): Promise<void>;
export async function showWarning(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showWarning(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showWarningMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showWarningMessage(message, { modal });
    return;
}

export async function showError(message: string, modal?: boolean): Promise<void>;
export async function showError(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showError(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showErrorMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showErrorMessage(message, { modal });
    return;
}