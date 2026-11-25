import { ServerRole } from '@/app/_constants/constants';

export const ServerRoles: Record<ServerRole, { label: string; color: string }> = {
    [ServerRole.Admin]: { label: 'Admin', color: '#E8796D' },
    [ServerRole.Developer]: { label: 'Developer', color: '#B39CF5' },
    [ServerRole.Moderator]: { label: 'Moderator', color: '#5FB0E6' },
    [ServerRole.Contributor]: { label: 'Contributor', color: '#DCB84F' },
};
