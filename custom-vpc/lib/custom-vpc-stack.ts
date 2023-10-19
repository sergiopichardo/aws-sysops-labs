import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CustomVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // 1. Create VPC 
    const vpc = new ec2.CfnVPC(this, 'CustomVPC', {
      cidrBlock: '10.0.0.0/16',
      // https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns.html#vpc-dns-support
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [{
        key: 'Name', 
        value: 'MyVPC'
      }]
    }); 

    // 2. Create Public Subnets 
    const publicSubnet1A = new ec2.CfnSubnet(this, 'Public-1A', {
      cidrBlock: '10.0.1.0/24', 
      vpcId: vpc.ref,
      mapPublicIpOnLaunch: true,
      availabilityZone: 'us-east-1a', 
      tags: [{
        key: 'Name',
        value: 'Public-1A'
      }]
    });

    const publicSubnet1B = new ec2.CfnSubnet(this, 'Public-1B', {
      cidrBlock: '10.0.2.0/24', 
      vpcId: vpc.ref,
      mapPublicIpOnLaunch: true,
      availabilityZone: 'us-east-1b', 
      tags: [{
        key: 'Name',
        value: 'Public-1B'
      }]
    });

    const privateSubnet1A = new ec2.CfnSubnet(this, 'Private-1A', {
      cidrBlock: '10.0.3.0/24', 
      vpcId: vpc.ref,
      availabilityZone: 'us-east-1a', 
      tags: [{
        key: 'Name',
        value: 'Private-1A'
      }]
    });

    const privateSubnet1B = new ec2.CfnSubnet(this, 'Private-1B', {
      cidrBlock: '10.0.4.0/24', 
      vpcId: vpc.ref,
      availabilityZone: 'us-east-1b', 
      tags: [{
        key: 'Name',
        value: 'Private-1B'
      }]
    });

    // 3. Create Internet Gateway
    const internetGateway = new ec2.CfnInternetGateway(this, 'Internet', {
      tags: [{
        key: 'Name', 
        value: 'MyInternetGateway'
      }]
    }); 

    // 4. Create an Internet Gateway Attachment 
    new ec2.CfnVPCGatewayAttachment(this, 'VPCIGWAttachement', {
      vpcId: vpc.ref,
      internetGatewayId: internetGateway.ref
    });


    // 5. Create Public Route Table 
    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.ref,
      tags: [{
        key: 'Name',
        value: 'PublicRouteTable'
      }]
    });

    // Create a route table association 
    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet1AAssociation', {
      subnetId: publicSubnet1A.ref,
      routeTableId: publicRouteTable.ref
    });

    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet1BAssociation', {
      subnetId: publicSubnet1B.ref,
      routeTableId: publicRouteTable.ref
    });

    // Create Public Route
    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.ref,
    }); 

    // 6. Create Private Route Table 
    const privateRouteTable = new ec2.CfnRouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.ref,
      tags: [{
        key: 'Name',
        value: 'PrivateRouteTable'
      }]
    });

    // Create Private route table associations 
    new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateSubnet1AAssociation', {
      subnetId: privateSubnet1A.ref,
      routeTableId: privateRouteTable.ref,
    });

    new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateSubnet1BAssociation', {
      subnetId: privateSubnet1B.ref,
      routeTableId: privateRouteTable.ref
    });    

    // Create NAT Gateway 
    // const elasticIp = new ec2.CfnEIP(this, 'EIPForNatGateway', {
    //   domain: 'vpc',
    //   tags: [{
    //     key: 'Name',
    //     value: 'NATGatewayElasticIP'
    //   }]
    // }); 

    // const natGateway = new ec2.CfnNatGateway(this, 'MyNATGateway', {
    //   subnetId: publicSubnet1A.ref,
    //   connectivityType: 'public',
    //   allocationId: elasticIp.attrAllocationId,
    //   tags: [{
    //     key: 'Name',
    //     value: 'MyNatGateway'
    //   }]
    // });

    // new ec2.CfnRoute(this, 'PublicRouteForPrivateSubnet', {
    //   routeTableId: privateRouteTable.ref,
    //   destinationCidrBlock: '0.0.0.0/0',
    //   natGatewayId: natGateway.ref
    // });


    // Security Group
    // const webAccessSecurityGroup = new ec2.CfnSecurityGroup(this, 'WebAccessSecurityGroup', {
    //   vpcId: vpc.ref,
    //   groupDescription: 'Web Access Security Group',
    //   securityGroupEgress: [
    //     {
    //       description: 'Outbound access',
    //       cidrIp: '0.0.0.0/0',
    //       ipProtocol: '-1', // allow all traffic on all protocols
    //     },
    //   ],
    //   securityGroupIngress: [
    //     {
    //       description: 'SSH Inbound Rule',
    //       cidrIp: '0.0.0.0/0', // change this to your ip address for enhanced security
    //       ipProtocol: 'tcp',
    //       fromPort: 22, 
    //       toPort: 22
    //     },
    //     {
    //       description: 'HTTP inbound rule',
    //       cidrIp: '0.0.0.0/0', 
    //       ipProtocol: 'tcp',
    //       fromPort: 80, 
    //       toPort: 80
    //     },
    //   ],
    //   tags: [{
    //     key: 'Name',
    //     value: 'WebAccessSecurityGroup'
    //   }]
    // })

    const amazonLinuxAmi2 = ec2.MachineImage.latestAmazonLinux2();

    // Create an EC2 instance 
    // const ec2Instance = new ec2.CfnInstance(this, 'CustomInstance', {
    //   instanceType: 't2.micro',
    //   imageId: amazonLinuxAmi2.getImage(this).imageId,
    //   keyName: process.env.KEY_PAIR_NAME as string,
    //   networkInterfaces: [
    //     {
    //       associatePublicIpAddress: true,
    //       deviceIndex: '0', // primary network interface
    //       groupSet: [webAccessSecurityGroup.ref],
    //       subnetId: publicSubnet1A.ref
    //     }
    //   ],
    //   tags: [{
    //     key: 'Name',
    //     value: 'MyEc2Instance'
    //   }]
    // });

    // NOTE: run `sudo lsblk -e7` to list the volumes in the EC2 instance
    // Newer Linux kernel may rename your devices to `/dev/xvdf` through
    // `/dev/xvdp` internally, even when the device name entered here 
    // (and shown in the details) is `/dev/sdf` through `dev/sdp`
    // const ebsVolume = new ec2.CfnVolume(this, 'EBSVolume', {
    //   volumeType: 'gp2',
    //   availabilityZone: 'us-east-1a',
    //   size: 16,
    //   tags: [{
    //     key: 'Name',
    //     value: 'test-volume-1'
    //   }]
    // });

    // new ec2.CfnVolumeAttachment(this, 'EBSVolumeAttachment', {
    //   volumeId: ebsVolume.ref,
    //   instanceId: ec2Instance.ref,
    //   device: '/dev/sdh'
    // });

    /*
     ***************************************************************
     * Elastic File Sytem
     ***************************************************************
     */
    const efsSecurityGroup = new ec2.CfnSecurityGroup(this, 'FileSystemSecurityGroup', {
      tags: [{ key: 'Name', value: 'EFS Security Group'}],
      vpcId: vpc.ref,
      groupDescription: 'File System Security Group',
      securityGroupIngress: [
        {
          description: 'NFS Inbound rule',
          cidrIp: '0.0.0.0/0', // change this to your ip address for enhanced security
          ipProtocol: 'tcp',
          fromPort: 2049, 
          toPort: 2049
        },
        {
          description: 'SSH Inbound Rule',
          cidrIp: '0.0.0.0/0', // change this to your ip address for enhanced security
          ipProtocol: 'tcp',
          fromPort: 22, 
          toPort: 22
        },
      ],
      securityGroupEgress: [
        {
          description: 'Outbound access',
          cidrIp: '0.0.0.0/0',
          ipProtocol: '-1', // allow all traffic on all protocols
        },
      ] 
    })

    const ec2InstanceEFS = new ec2.CfnInstance(this, 'EFSLabEC2Instance', {
      instanceType: 't2.micro',
      imageId: amazonLinuxAmi2.getImage(this).imageId,
      keyName: process.env.KEY_PAIR_NAME as string,
      networkInterfaces: [
        {
          associatePublicIpAddress: true,
          deviceIndex: '0', // primary network interface
          groupSet: [efsSecurityGroup.ref],
          subnetId: publicSubnet1A.ref
        }
      ],
      tags: [{
        key: 'Name',
        value: 'EFSLabEC2Instnace'
      }]
    });

    // Enforce in-transit encryption for all clients
    const myFileSystemPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: [
            'elasticfilesystem:ClientRootAccess',
            'elasticfilesystem:ClientWrite',
            'elasticfilesystem:ClientMount',
          ],
          conditions: {
            Bool: {
              'elasticfilesystem:AccessedViaMountTarget': 'true',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AccountRootPrincipal()],
          actions: ["*"],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        }),
      ],
    });
    

    // NOTE: Launch EFS without specifying the AZ 
    const fileSystem = new efs.CfnFileSystem(this, 'ElasticFileSystem', {
      fileSystemTags: [{ key: 'Name', value: 'ElasticFileSystem'}],
      encrypted: true,
      backupPolicy: {
        status: 'ENABLED',
      },
      lifecyclePolicies: [
        {
          transitionToIa: efs.LifecyclePolicy.AFTER_30_DAYS,
        }
      ],
      fileSystemPolicy: myFileSystemPolicy
    });


    new efs.CfnAccessPoint(this, 'AccessPoint', {
      fileSystemId: fileSystem.ref,
    });

    // // Mount Target public AZ A
    new efs.CfnMountTarget(this, 'MountTargetPublic1A', {
      fileSystemId: fileSystem.ref,
      subnetId: publicSubnet1A.ref,
      securityGroups: [
        efsSecurityGroup.ref
      ]
    });

    // Mount Target public AZ B
    new efs.CfnMountTarget(this, 'MountTargetPublic1B', {
      fileSystemId: fileSystem.ref,
      subnetId: publicSubnet1B.ref,
      securityGroups: [
        efsSecurityGroup.ref
      ]
    });

    



  }
}
