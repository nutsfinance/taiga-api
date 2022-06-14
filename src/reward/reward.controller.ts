import { Controller, Get, Param, Query } from '@nestjs/common';
import { FixedPointNumber } from '@acala-network/sdk-core';
import fetch from 'axios';
import * as _ from "lodash";
import { RewardService } from './reward.service';

export interface PoolApr {
  native: number,
  incentive: number
}

export interface UserReward {
  token: string,
  amount: number
}

interface PoolDailyData {
  yieldVolume: number,
  feeVolume: number,
  totalSupply: number,
  timestamp: string
}

@Controller('rewards')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @Get('apr')
  async getApr(@Query('network') network, @Query('pool') pool): Promise<PoolApr> {
    const native = await getPoolAPR(network, pool);
    const incentive = (network === "karura" && pool == 0)
      ? await getTaiKsmIncentiveAPR(new FixedPointNumber(4000))
      : 0;

    return {
      native,
      incentive
    };
  }

  @Get('cycle')
  async getCycle(): Promise<number> {
    return await this.rewardService.getCurrentCycle();
  }

  @Get('user/:user')
  async getUserReward(@Param('user') user: string) {
    return await this.rewardService.getClaimableFor(user);
  }

}

async function getPoolAPR(network: string, poolId: number): Promise<number> {
  const query = `https://api.subquery.network/sq/nutsfinance/stable-asset-${network}?`
  + `query={dailyData(first:30, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: ${poolId}}}) {nodes{yieldVolume feeVolume totalSupply}}}`;
  const result = await fetch(query);
  if (result.status != 200) {
    return 0;
  }

  const data = result.data.data.dailyData.nodes;
  const dailyFeeApr = data.map((dailyData: PoolDailyData) => dailyData.feeVolume * 365 / dailyData.totalSupply);
  const dailyYieldApr = data.map((dailyData: PoolDailyData) => dailyData.yieldVolume * 365 / dailyData.totalSupply);

  const feeApr = _.mean(dailyFeeApr.filter(apr => apr < 0.5));
  const yieldApr = _.mean(dailyYieldApr);

  console.log(feeApr, yieldApr);

  return feeApr + yieldApr;
}

async function getTaiKsmIncentiveAPR(dailyRewardAmount: FixedPointNumber): Promise<number> {
  const query1 = "https://api.subquery.network/sq/nutsfinance/stable-asset-karura?"
  + "query={dailyData(first:30, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: 0}}) {nodes{totalSupply}}}";
  const result1 = await fetch(query1);
  if (result1.status != 200) {
    return 0;
  }
  const dailyTotalSupply = result1.data.data.dailyData.nodes.map((node: {totalSupply: string}) => node.totalSupply);

  const query2 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"TAI"){dailyData(first:30, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result2 = await fetch(query2);
  if (result2.status != 200) {
    return 0;
  }
  const dailyTaiPrice = result2.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);

  const query3 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"sa://0"){dailyData(first:30, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result3 = await fetch(query3);
  if (result3.status != 200) {
    return 0;
  }
  const dailyTaiKsmPrice = result3.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);

  let totalAPR = FixedPointNumber.ZERO;
  for (let i = 0; i < dailyTotalSupply.length; i++) {
    const taiValue = dailyRewardAmount.mul(FixedPointNumber.fromInner(dailyTaiPrice[i], 18));
    const taiKsmValue = new FixedPointNumber(dailyTotalSupply[i]).mul(FixedPointNumber.fromInner(dailyTaiKsmPrice[i], 18));
    const apr = taiValue.mul(new FixedPointNumber("365")).div(taiKsmValue);

    totalAPR = totalAPR.add(apr);
  }
  return totalAPR.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber();
}