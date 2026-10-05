import { z } from 'zod';
import {
  MAX_LABEL_LENGTH,
  MAX_ROUTER_RULES,
  MAX_RULE_CONDITIONS,
  MAX_TEMPLATE_LENGTH,
} from '../limits/limit.constants';
import { ConditionOperator, RuleMatch } from './condition.constants';

export const conditionValueSchema = z.union([
  z.string().max(MAX_TEMPLATE_LENGTH),
  z.number(),
  z.boolean(),
  z.array(z.string().max(MAX_TEMPLATE_LENGTH)),
  z.null(),
]);

export const conditionSchema = z.object({
  variable: z.string().max(MAX_TEMPLATE_LENGTH),
  operator: z.enum(ConditionOperator),
  value: conditionValueSchema,
});

export const routerRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(MAX_LABEL_LENGTH),
  match: z.enum(RuleMatch),
  conditions: z.array(conditionSchema).max(MAX_RULE_CONDITIONS),
});

export const routerRulesSchema = z.array(routerRuleSchema).max(MAX_ROUTER_RULES);
