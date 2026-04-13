import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { GameServer } from './constructs/game-server';
import { ServerControlApi } from './constructs/server-control-api';

export class CorekeeperServerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const gameServer = new GameServer(this, 'GameServer');
    new ServerControlApi(this, 'ServerControlApi', { instance: gameServer.instance });
  }
}
