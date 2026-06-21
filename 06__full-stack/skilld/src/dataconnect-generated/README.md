# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetAllSkills*](#getallskills)
  - [*GetUsers*](#getusers)
  - [*GetSkills*](#getskills)
- [**Mutations**](#mutations)
  - [*InsertUser*](#insertuser)
  - [*InsertSkill*](#insertskill)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetAllSkills
You can execute the `GetAllSkills` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAllSkills(options?: ExecuteQueryOptions): QueryPromise<GetAllSkillsData, undefined>;

interface GetAllSkillsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllSkillsData, undefined>;
}
export const getAllSkillsRef: GetAllSkillsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAllSkills(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAllSkillsData, undefined>;

interface GetAllSkillsRef {
  ...
  (dc: DataConnect): QueryRef<GetAllSkillsData, undefined>;
}
export const getAllSkillsRef: GetAllSkillsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAllSkillsRef:
```typescript
const name = getAllSkillsRef.operationName;
console.log(name);
```

### Variables
The `GetAllSkills` query has no variables.
### Return Type
Recall that executing the `GetAllSkills` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAllSkillsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetAllSkills`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAllSkills } from '@dataconnect/generated';


// Call the `getAllSkills()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAllSkills();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAllSkills(dataConnect);

console.log(data.skills);

// Or, you can use the `Promise` API.
getAllSkills().then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

### Using `GetAllSkills`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAllSkillsRef } from '@dataconnect/generated';


// Call the `getAllSkillsRef()` function to get a reference to the query.
const ref = getAllSkillsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAllSkillsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.skills);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

## GetUsers
You can execute the `GetUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUsers(options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;

interface GetUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUsersData, undefined>;
}
export const getUsersRef: GetUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUsersData, undefined>;

interface GetUsersRef {
  ...
  (dc: DataConnect): QueryRef<GetUsersData, undefined>;
}
export const getUsersRef: GetUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUsersRef:
```typescript
const name = getUsersRef.operationName;
console.log(name);
```

### Variables
The `GetUsers` query has no variables.
### Return Type
Recall that executing the `GetUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUsersData {
  users: ({
    clerkId: string;
    email: string;
    username?: string | null;
    imageUrl?: string | null;
  } & User_Key)[];
}
```
### Using `GetUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUsers } from '@dataconnect/generated';


// Call the `getUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
getUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `GetUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUsersRef } from '@dataconnect/generated';


// Call the `getUsersRef()` function to get a reference to the query.
const ref = getUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetSkills
You can execute the `GetSkills` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSkills(vars?: GetSkillsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSkillsData, GetSkillsVariables>;

interface GetSkillsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetSkillsVariables): QueryRef<GetSkillsData, GetSkillsVariables>;
}
export const getSkillsRef: GetSkillsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSkills(dc: DataConnect, vars?: GetSkillsVariables, options?: ExecuteQueryOptions): QueryPromise<GetSkillsData, GetSkillsVariables>;

interface GetSkillsRef {
  ...
  (dc: DataConnect, vars?: GetSkillsVariables): QueryRef<GetSkillsData, GetSkillsVariables>;
}
export const getSkillsRef: GetSkillsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSkillsRef:
```typescript
const name = getSkillsRef.operationName;
console.log(name);
```

### Variables
The `GetSkills` query has an optional argument of type `GetSkillsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSkillsVariables {
  searchTerm?: string | null;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetSkills` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSkillsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetSkills`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSkills, GetSkillsVariables } from '@dataconnect/generated';

// The `GetSkills` query has an optional argument of type `GetSkillsVariables`:
const getSkillsVars: GetSkillsVariables = {
  searchTerm: ..., // optional
  limit: ..., // optional
};

// Call the `getSkills()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSkills(getSkillsVars);
// Variables can be defined inline as well.
const { data } = await getSkills({ searchTerm: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `GetSkillsVariables` argument.
const { data } = await getSkills();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSkills(dataConnect, getSkillsVars);

console.log(data.skills);

// Or, you can use the `Promise` API.
getSkills(getSkillsVars).then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

### Using `GetSkills`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSkillsRef, GetSkillsVariables } from '@dataconnect/generated';

// The `GetSkills` query has an optional argument of type `GetSkillsVariables`:
const getSkillsVars: GetSkillsVariables = {
  searchTerm: ..., // optional
  limit: ..., // optional
};

// Call the `getSkillsRef()` function to get a reference to the query.
const ref = getSkillsRef(getSkillsVars);
// Variables can be defined inline as well.
const ref = getSkillsRef({ searchTerm: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `GetSkillsVariables` argument.
const ref = getSkillsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSkillsRef(dataConnect, getSkillsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.skills);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## InsertUser
You can execute the `InsertUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertUser(vars: InsertUserVariables): MutationPromise<InsertUserData, InsertUserVariables>;

interface InsertUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertUserVariables): MutationRef<InsertUserData, InsertUserVariables>;
}
export const insertUserRef: InsertUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertUser(dc: DataConnect, vars: InsertUserVariables): MutationPromise<InsertUserData, InsertUserVariables>;

interface InsertUserRef {
  ...
  (dc: DataConnect, vars: InsertUserVariables): MutationRef<InsertUserData, InsertUserVariables>;
}
export const insertUserRef: InsertUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertUserRef:
```typescript
const name = insertUserRef.operationName;
console.log(name);
```

### Variables
The `InsertUser` mutation requires an argument of type `InsertUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertUserVariables {
  clerkId: string;
  email: string;
  imageUrl?: string | null;
  username?: string | null;
}
```
### Return Type
Recall that executing the `InsertUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertUserData {
  user_insert: User_Key;
}
```
### Using `InsertUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertUser, InsertUserVariables } from '@dataconnect/generated';

// The `InsertUser` mutation requires an argument of type `InsertUserVariables`:
const insertUserVars: InsertUserVariables = {
  clerkId: ..., 
  email: ..., 
  imageUrl: ..., // optional
  username: ..., // optional
};

// Call the `insertUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertUser(insertUserVars);
// Variables can be defined inline as well.
const { data } = await insertUser({ clerkId: ..., email: ..., imageUrl: ..., username: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertUser(dataConnect, insertUserVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
insertUser(insertUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `InsertUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertUserRef, InsertUserVariables } from '@dataconnect/generated';

// The `InsertUser` mutation requires an argument of type `InsertUserVariables`:
const insertUserVars: InsertUserVariables = {
  clerkId: ..., 
  email: ..., 
  imageUrl: ..., // optional
  username: ..., // optional
};

// Call the `insertUserRef()` function to get a reference to the mutation.
const ref = insertUserRef(insertUserVars);
// Variables can be defined inline as well.
const ref = insertUserRef({ clerkId: ..., email: ..., imageUrl: ..., username: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertUserRef(dataConnect, insertUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## InsertSkill
You can execute the `InsertSkill` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertSkill(vars: InsertSkillVariables): MutationPromise<InsertSkillData, InsertSkillVariables>;

interface InsertSkillRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertSkillVariables): MutationRef<InsertSkillData, InsertSkillVariables>;
}
export const insertSkillRef: InsertSkillRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertSkill(dc: DataConnect, vars: InsertSkillVariables): MutationPromise<InsertSkillData, InsertSkillVariables>;

interface InsertSkillRef {
  ...
  (dc: DataConnect, vars: InsertSkillVariables): MutationRef<InsertSkillData, InsertSkillVariables>;
}
export const insertSkillRef: InsertSkillRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertSkillRef:
```typescript
const name = insertSkillRef.operationName;
console.log(name);
```

### Variables
The `InsertSkill` mutation requires an argument of type `InsertSkillVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertSkill` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertSkillData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertSkillData {
  skill_insert: Skill_Key;
}
```
### Using `InsertSkill`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertSkill, InsertSkillVariables } from '@dataconnect/generated';

// The `InsertSkill` mutation requires an argument of type `InsertSkillVariables`:
const insertSkillVars: InsertSkillVariables = {
  id: ..., 
  authorClerkId: ..., 
  createdAt: ..., 
  description: ..., // optional
  installCommand: ..., 
  promptConfig: ..., 
  tags: ..., 
  title: ..., // optional
  usageExample: ..., 
};

// Call the `insertSkill()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertSkill(insertSkillVars);
// Variables can be defined inline as well.
const { data } = await insertSkill({ id: ..., authorClerkId: ..., createdAt: ..., description: ..., installCommand: ..., promptConfig: ..., tags: ..., title: ..., usageExample: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertSkill(dataConnect, insertSkillVars);

console.log(data.skill_insert);

// Or, you can use the `Promise` API.
insertSkill(insertSkillVars).then((response) => {
  const data = response.data;
  console.log(data.skill_insert);
});
```

### Using `InsertSkill`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertSkillRef, InsertSkillVariables } from '@dataconnect/generated';

// The `InsertSkill` mutation requires an argument of type `InsertSkillVariables`:
const insertSkillVars: InsertSkillVariables = {
  id: ..., 
  authorClerkId: ..., 
  createdAt: ..., 
  description: ..., // optional
  installCommand: ..., 
  promptConfig: ..., 
  tags: ..., 
  title: ..., // optional
  usageExample: ..., 
};

// Call the `insertSkillRef()` function to get a reference to the mutation.
const ref = insertSkillRef(insertSkillVars);
// Variables can be defined inline as well.
const ref = insertSkillRef({ id: ..., authorClerkId: ..., createdAt: ..., description: ..., installCommand: ..., promptConfig: ..., tags: ..., title: ..., usageExample: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertSkillRef(dataConnect, insertSkillVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.skill_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.skill_insert);
});
```

