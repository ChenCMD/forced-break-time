export class ErrorTemplate extends Error {
    constructor(e?: string) {
        super(e);
        this.name = new.target.name;
    }

    toString(): string {
        return this.message ? `${this.name}: ${this.message}` : `${this.name}`;
    }
}

export class UserCancelledError extends ErrorTemplate { }