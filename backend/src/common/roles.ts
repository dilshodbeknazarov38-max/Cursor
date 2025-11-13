export enum Role {
  ADMIN = 'Admin',
  TARGET_ADMIN = 'Target Admin',
  OPER_ADMIN = 'Oper Admin',
  SKLAD_ADMIN = 'Sklad Admin',
  TAMINOTCHI = 'Taminotchi',
  TARGETOLOG = 'Targetolog',
  OPERATOR = 'Operator',
}

export const ALL_ROLES: Role[] = [
  Role.ADMIN,
  Role.TARGET_ADMIN,
  Role.OPER_ADMIN,
  Role.SKLAD_ADMIN,
  Role.TAMINOTCHI,
  Role.TARGETOLOG,
  Role.OPERATOR,
];
