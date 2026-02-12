export interface ArElement {
    id?: string;
    uid?: string;
    name?: string;
    displayName?: string;
    normalizedName?: string;
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    email?: string;
    position?: string;
    latitude?: string;
    longitude?: string;
    location?: string;
    owner?: string;
    idUser?: string;
    autor?: string;
    dateCreated?: any;
    dateModified?: any;
    elements?: ArElement[];
    images?: ArElement[];
    areas?: ArElement[];
    codes?: string[];
    code?: string;
    redirect?: boolean;
    views?: number;
    indexInit?: number;
    indexEnd?: number;
    status?: boolean;
    extUrl?: string;
}

export interface SearchParams {
    fileToSearch?: string;
    place?: string;
    caller: string;
}
