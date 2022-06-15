import { Controller, Get, Param, Query } from '@nestjs/common';
import { FixedPointNumber } from '@acala-network/sdk-core';
import fetch from 'axios';
import * as _ from "lodash";
import { RewardService } from './reward.service';
``
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
  async getApr(@Query('network') network, @Query('pool') pool) {
    if (network === 'karura') {
      if (pool == 0)  return await getTaiKsmApr();
      if (pool == 1)  return await get3UsdApr();
    } else if (network === 'acala') {
      if (pool == 0)  return await getTdotApr();
    }
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

async function getTaiKsmApr() {
  const poolApr = await getPoolAPR('karura', 0);

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
    // 4000 TAI each day
    const taiValue = new FixedPointNumber(4000).mul(FixedPointNumber.fromInner(dailyTaiPrice[i], 18));
    const taiKsmValue = new FixedPointNumber(dailyTotalSupply[i]).mul(FixedPointNumber.fromInner(dailyTaiKsmPrice[i], 18));
    const apr = taiValue.mul(new FixedPointNumber("365")).div(taiKsmValue);

    totalAPR = totalAPR.add(apr);
  }

  return {
    "sa://0": poolApr,
    "TAI": totalAPR.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber()
  };
}

async function get3UsdApr() {
  const poolApr = await getPoolAPR('karura', 1);

  const query1 = "https://api.subquery.network/sq/nutsfinance/stable-asset-karura?"
  + "query={dailyData(first:4, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: 1}}) {nodes{totalSupply}}}";
  const result1 = await fetch(query1);
  if (result1.status != 200) {
    return 0;
  }
  const dailyTotalSupply = result1.data.data.dailyData.nodes.map((node: {totalSupply: string}) => node.totalSupply);

  const query2 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"TAI"){dailyData(first:4, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result2 = await fetch(query2);
  if (result2.status != 200) {
    return 0;
  }
  const dailyTaiPrice = result2.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);

  const query3 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"sa://0"){dailyData(first:4, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result3 = await fetch(query3);
  if (result3.status != 200) {
    return 0;
  }
  const dailyTaiKsmPrice = result3.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);

  const query4 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"LKSM"){dailyData(first:4, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result4 = await fetch(query4);
  if (result4.status != 200) {
    return 0;
  }
  const dailyLksmPrice = result4.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);

  const query5 = "https://api.subquery.network/sq/AcalaNetwork/karura-dex?"
  + `query={token(id:"KAR"){dailyData(first:4, orderBy: TIMESTAMP_DESC){nodes{price}}}}`;
  const result5 = await fetch(query5);
  if (result5.status != 200) {
    return 0;
  }
  const dailyKarPrice = result5.data.data.token.dailyData.nodes.map((node: {price: string}) => node.price);
  
  let taiApr = FixedPointNumber.ZERO;
  let taiKsmApr = FixedPointNumber.ZERO;
  let lksmApr = FixedPointNumber.ZERO;
  let karApr = FixedPointNumber.ZERO;
  for (let i = 0; i < dailyTotalSupply.length; i++) {
    // 20000 TAI per week
    const taiValue = new FixedPointNumber(20000).mul(FixedPointNumber.fromInner(dailyTaiPrice[i], 18));
    taiApr = taiApr.add(taiValue.mul(new FixedPointNumber(365.0 / 7)).div(new FixedPointNumber(dailyTotalSupply[i])));

    // 75 taiKSM per week
    const taiKsmValue = new FixedPointNumber(75).mul(FixedPointNumber.fromInner(dailyTaiKsmPrice[i], 18));
    taiKsmApr = taiKsmApr.add(taiKsmValue.mul(new FixedPointNumber(365.0 / 7)).div(new FixedPointNumber(dailyTotalSupply[i])));

    // 500 LKSM per week
    const lksmValue = new FixedPointNumber(500).mul(FixedPointNumber.fromInner(dailyLksmPrice[i], 18));
    lksmApr = lksmApr.add(lksmValue.mul(new FixedPointNumber(365.0 / 7)).div(new FixedPointNumber(dailyTotalSupply[i])));

    // 2400 KAR per week
    const karValue = new FixedPointNumber(2400).mul(FixedPointNumber.fromInner(dailyKarPrice[i], 18));
    karApr = karApr.add(karValue.mul(new FixedPointNumber(365.0 / 7)).div(new FixedPointNumber(dailyTotalSupply[i])));
  }

  return {
    "sa://1": poolApr,
    "TAI": taiApr.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber(),
    "sa://0": taiKsmApr.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber(),
    "LKSM": lksmApr.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber(),
    "KAR": karApr.div(new FixedPointNumber(dailyTotalSupply.length)).toNumber(),
  }
}

async function getTdotApr() {
  const poolApr = await getPoolAPR('acala', 0);

  return {
    "sa://0": poolApr
  }
}