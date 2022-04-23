import { Repository } from 'typeorm';

import { MockType } from '../shared/MockType';
import { IDatabaseUnitOfWorkInterface } from './database.service';

const repositoryMockFactory: <T>(entity) => MockType<Repository<T>> = jest.fn(() => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(() => Promise.resolve({})),
}));

/**
 * DatabaseUnitOfWork
 * mock class
 */
export const databaseUnitOfWorkMock = {
  setTransactionManager: jest.fn(),
  start: jest.fn().mockReturnValue(true),
  complete: jest.fn().mockImplementation(work => work()),
};

/**
 * DatabaseService
 * mock class
 */
export class DatabaseServiceMock {
  repositories: MockType<Repository<any>> = {};
  currentDUW: IDatabaseUnitOfWorkInterface;

  getRepository<T>(entity) {
    if (!this.repositories[entity]) {
      this.repositories[entity] = repositoryMockFactory<T>(entity);
    }
    return this.repositories[entity];
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  makeUnitOfWork() {}
}

DatabaseServiceMock.prototype.makeUnitOfWork = jest.fn().mockReturnValue(databaseUnitOfWorkMock);
