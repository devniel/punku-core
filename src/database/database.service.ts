import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import debug from 'debug';
import { Connection, EntityManager, QueryRunner, Repository } from 'typeorm';

export interface IDatabaseUnitOfWorkInterface {
  start(): void;
  complete<T>(work: () => Promise<T>): Promise<T>;
  getRepository<T>(entity): Repository<T>;
}

const log = debug('app:DatabaseUnitOfWork');

export class DatabaseUnitOfWork implements IDatabaseUnitOfWorkInterface {
  private readonly connection: Connection;
  private readonly queryRunner: QueryRunner;
  private transactionManager: EntityManager;

  constructor(connection: Connection) {
    this.connection = connection;
    this.queryRunner = this.connection.createQueryRunner();
  }

  setTransactionManager() {
    this.transactionManager = this.queryRunner.manager;
  }

  async start() {
    log('start()');
    log('isTransactionActive()', this.queryRunner.isTransactionActive);
    await this.queryRunner.startTransaction();
    this.setTransactionManager();
  }

  getRepository<T>(entity): Repository<T> {
    if (!this.transactionManager) {
      throw new Error('Unit of work is not started. Call the start() method');
    }
    return this.transactionManager.getRepository<T>(entity);
  }

  async complete<T>(work: () => Promise<T>): Promise<T> {
    log('complete()');
    return new Promise(async (resolve, reject) => {
      let result;
      try {
        log('complete() - work()');
        result = await work();
        log('complete() - commitTransaction()');
        await this.queryRunner.commitTransaction();
        resolve(result);
      } catch (error) {
        log('complete() - rollbackTransaction()');
        await this.queryRunner.rollbackTransaction();
        reject(error);
      } finally {
        log('complete() - release()');
        await this.queryRunner.release();
      }
    });
  }
}

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() public connection: Connection) {}

  async getRepository<T>(entity, unitOfWork?: IDatabaseUnitOfWorkInterface): Promise<Repository<T>> {
    if (unitOfWork) {
      return unitOfWork.getRepository(entity);
    } else {
      return this.connection.getRepository(entity);
    }
  }

  makeUnitOfWork(): IDatabaseUnitOfWorkInterface {
    return new DatabaseUnitOfWork(this.connection);
  }
}
