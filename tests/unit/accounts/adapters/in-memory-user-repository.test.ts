import { InMemoryUserRepository } from '../../../../src/modules/accounts/adapters/out/in-memory/in-memory-user-repository.js';
import { userRepositoryContract } from '../../../support/contracts/user-repository-contract.js';

userRepositoryContract('in-memory', () => Promise.resolve(new InMemoryUserRepository()));
