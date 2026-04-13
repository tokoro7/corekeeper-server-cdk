import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export class GameServer extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Core Keeper server security group',
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(27015), 'Core Keeper UDP 27015');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(27016), 'Core Keeper UDP 27016');

    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const ami = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
    );

    const setupScript = fs.readFileSync(
      path.join(__dirname, '../user-data/setup.sh'),
      'utf-8'
    );
    const userData = ec2.UserData.custom(setupScript);

    this.instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: sg,
      role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(20),
        },
        {
          deviceName: '/dev/sdb',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            deleteOnTermination: false,
          }),
        },
      ],
    });

    new cdk.CfnOutput(scope, 'InstanceId', {
      value: this.instance.instanceId,
      description: 'EC2 Instance ID',
    });
  }
}
