interface CreateOptions {
    directory?: string;
    template?: string;
    git?: boolean;
    install?: boolean;
    register?: boolean;
}
export declare function createProject(nameArg: string | undefined, options: CreateOptions): Promise<void>;
export {};
