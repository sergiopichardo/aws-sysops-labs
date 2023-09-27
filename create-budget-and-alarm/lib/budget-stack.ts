import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_budgets as budgets } from 'aws-cdk-lib';


export class BudgetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new budgets.CfnBudget(this, 'CostBudget', {
      budget: {
        budgetName: "Monthly Budget",
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 20.00,
          unit: "USD"
        },
        timePeriod: {
          start: convertDateToEpoch("2023-09-27"), 
          end: convertDateToEpoch("2087-06-14")
        }
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 99,
            thresholdType: "PERCENTAGE"
          },
          subscribers: [
            {
              subscriptionType: "EMAIL",
              address: "email@example.com",
            },
          ]
        }
      ],
    });
  }
}

function convertDateToEpoch(dateString: string): string {
  // Check if the dateString includes a time component
  const includesTime = dateString.includes('T') || dateString.includes(' ');
  
  // If dateString doesn't include a time component, append the start of the day in UTC
  const dateTimeString = includesTime ? dateString : `${dateString}T00:00:00Z`;
  
  const date = new Date(dateTimeString);
  return Math.floor(date.getTime() / 1000).toString();
}

