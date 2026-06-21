import { GetAllSkillsData, InsertUserData, InsertUserVariables, GetUsersData, GetSkillsData, GetSkillsVariables, InsertSkillData, InsertSkillVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetAllSkills(options?: useDataConnectQueryOptions<GetAllSkillsData>): UseDataConnectQueryResult<GetAllSkillsData, undefined>;
export function useGetAllSkills(dc: DataConnect, options?: useDataConnectQueryOptions<GetAllSkillsData>): UseDataConnectQueryResult<GetAllSkillsData, undefined>;

export function useInsertUser(options?: useDataConnectMutationOptions<InsertUserData, FirebaseError, InsertUserVariables>): UseDataConnectMutationResult<InsertUserData, InsertUserVariables>;
export function useInsertUser(dc: DataConnect, options?: useDataConnectMutationOptions<InsertUserData, FirebaseError, InsertUserVariables>): UseDataConnectMutationResult<InsertUserData, InsertUserVariables>;

export function useGetUsers(options?: useDataConnectQueryOptions<GetUsersData>): UseDataConnectQueryResult<GetUsersData, undefined>;
export function useGetUsers(dc: DataConnect, options?: useDataConnectQueryOptions<GetUsersData>): UseDataConnectQueryResult<GetUsersData, undefined>;

export function useGetSkills(vars?: GetSkillsVariables, options?: useDataConnectQueryOptions<GetSkillsData>): UseDataConnectQueryResult<GetSkillsData, GetSkillsVariables>;
export function useGetSkills(dc: DataConnect, vars?: GetSkillsVariables, options?: useDataConnectQueryOptions<GetSkillsData>): UseDataConnectQueryResult<GetSkillsData, GetSkillsVariables>;

export function useInsertSkill(options?: useDataConnectMutationOptions<InsertSkillData, FirebaseError, InsertSkillVariables>): UseDataConnectMutationResult<InsertSkillData, InsertSkillVariables>;
export function useInsertSkill(dc: DataConnect, options?: useDataConnectMutationOptions<InsertSkillData, FirebaseError, InsertSkillVariables>): UseDataConnectMutationResult<InsertSkillData, InsertSkillVariables>;
