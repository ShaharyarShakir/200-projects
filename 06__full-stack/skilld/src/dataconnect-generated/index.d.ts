import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface GetAllSkillsData {
  skills: ({
    author: {
      clerkId: string;
      email: string;
      username?: string | null;
      imageUrl?: string | null;
    } & User_Key;
    title?: string | null;
    description?: string | null;
    tags: string[];
    installCommand: string;
    promptConfig: string;
    usageExample: string;
    createdAt: TimestampString;
  })[];
}

export interface GetSkillsData {
  skills: ({
    id: UUIDString;
    title?: string | null;
    description?: string | null;
    tags: string[];
    createdAt: TimestampString;
    installCommand: string;
    promptConfig: string;
    usageExample: string;
    author: {
      username?: string | null;
      imageUrl?: string | null;
      clerkId: string;
      email: string;
    } & User_Key;
  } & Skill_Key)[];
}

export interface GetSkillsVariables {
  searchTerm?: string | null;
  limit?: number | null;
}

export interface GetUsersData {
  users: ({
    clerkId: string;
    email: string;
    username?: string | null;
    imageUrl?: string | null;
  } & User_Key)[];
}

export interface InsertSkillData {
  skill_insert: Skill_Key;
}

export interface InsertSkillVariables {
  id: UUIDString;
  authorClerkId: string;
  createdAt: TimestampString;
  description?: string | null;
  installCommand: string;
  promptConfig: string;
  tags: string[];
  title?: string | null;
  usageExample: string;
}

export interface InsertUserData {
  user_insert: User_Key;
}

export interface InsertUserVariables {
  clerkId: string;
  email: string;
  imageUrl?: string | null;
  username?: string | null;
}

export interface Skill_Key {
  id: UUIDString;
  __typename?: 'Skill_Key';
}

export interface User_Key {
  clerkId: string;
  __typename?: 'User_Key';
}

interface GetAllSkillsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllSkillsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetAllSkillsData, undefined>;
  operationName: string;
}
export const getAllSkillsRef: GetAllSkillsRef;

export function getAllSkills(options?: ExecuteQueryOptions): QueryPromise<GetAllSkillsData, undefined>;
export function getAllSkills(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAllSkillsData, undefined>;

interface InsertUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertUserVariables): MutationRef<InsertUserData, InsertUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertUserVariables): MutationRef<InsertUserData, InsertUserVariables>;
  operationName: string;
}
export const insertUserRef: InsertUserRef;

export function insertUser(vars: InsertUserVariables): MutationPromise<InsertUserData, InsertUserVariables>;
export function insertUser(dc: DataConnect, vars: InsertUserVariables): MutationPromise<InsertUserData, InsertUserVariables>;

interface GetUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUsersData, undefined>;
  operationName: string;
}
export const getUsersRef: GetUsersRef;

export function getUsers(options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;
export function getUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;

interface GetSkillsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetSkillsVariables): QueryRef<GetSkillsData, GetSkillsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetSkillsVariables): QueryRef<GetSkillsData, GetSkillsVariables>;
  operationName: string;
}
export const getSkillsRef: GetSkillsRef;

export function getSkills(vars?: GetSkillsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSkillsData, GetSkillsVariables>;
export function getSkills(dc: DataConnect, vars?: GetSkillsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSkillsData, GetSkillsVariables>;

interface InsertSkillRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertSkillVariables): MutationRef<InsertSkillData, InsertSkillVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertSkillVariables): MutationRef<InsertSkillData, InsertSkillVariables>;
  operationName: string;
}
export const insertSkillRef: InsertSkillRef;

export function insertSkill(vars: InsertSkillVariables): MutationPromise<InsertSkillData, InsertSkillVariables>;
export function insertSkill(dc: DataConnect, vars: InsertSkillVariables): MutationPromise<InsertSkillData, InsertSkillVariables>;

