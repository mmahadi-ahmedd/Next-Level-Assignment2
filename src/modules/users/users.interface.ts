export interface Iuser{
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'contributor' | 'maintainer';
    created_at: Date;
    updated_at: Date;
}