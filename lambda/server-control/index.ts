import { EC2Client, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2';

const client = new EC2Client({});
const instanceId = process.env.INSTANCE_ID!;

export const handler = async (event: { path: string }) => {
  const path = event.path;

  if (path === '/start') {
    await client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
    return { statusCode: 200, body: JSON.stringify({ message: 'Starting instance' }) };
  }

  if (path === '/stop') {
    await client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
    return { statusCode: 200, body: JSON.stringify({ message: 'Stopping instance' }) };
  }

  return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
};
