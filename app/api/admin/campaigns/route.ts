import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaigns = await db.campaign.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { transactions: true, imports: true } } } });
  const rows = await Promise.all(campaigns.map(async c => {
    const [sum, people] = await Promise.all([db.lotteryTransaction.aggregate({ where: { campaignId: c.id }, _sum: { ticketCount: true } }), db.lotteryTransaction.findMany({ where: { campaignId: c.id }, distinct: ["phoneNumber"], select: { phoneNumber: true } })]);
    const tickets = sum._sum.ticketCount ?? 0;
    return { id:c.id,title:c.title,description:c.description,heroImageUrl:c.heroImageUrl,targetTicketCount:c.targetTicketCount,status:c.status,isActive:c.isActive,updatedAt:c.updatedAt,participants:people.length,tickets,transactionCount:c._count.transactions,importCount:c._count.imports,remaining:c.targetTicketCount==null?null:Math.max(0,c.targetTicketCount-tickets),percent:c.targetTicketCount?Math.min(100,Math.round(tickets/c.targetTicketCount*100)):0 };
  }));
  return NextResponse.json({ campaigns: rows }, { headers: { "Cache-Control": "no-store" } });
}
const createSchema=z.object({title:z.string().trim().min(2).max(100),description:z.string().trim().max(600).default(""),targetTicketCount:z.number().int().positive().max(100000000).nullable().default(null)});
export async function POST(request:NextRequest){
  if(!(await isAdmin()))return NextResponse.json({error:"Нэвтрэх шаардлагатай."},{status:401});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Сугалааны нэр болон зорилтот эрхийн тоог шалгана уу."},{status:400});
  const campaign=await db.campaign.create({data:{...parsed.data,status:"DRAFT",isActive:false}});
  await db.adminAuditLog.create({data:{action:"CAMPAIGN_CREATED",details:{campaignId:campaign.id,title:campaign.title}}});
  return NextResponse.json({ok:true,campaign:{id:campaign.id,title:campaign.title}},{status:201});
}
const actionSchema=z.object({campaignId:z.string().min(1),action:z.enum(["PUBLISH","DRAFT","ACTIVATE","PAUSE"])});
export async function PATCH(request:NextRequest){
  if(!(await isAdmin()))return NextResponse.json({error:"Нэвтрэх шаардлагатай."},{status:401});
  const parsed=actionSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Үйлдлийн мэдээлэл буруу байна."},{status:400});
  const {campaignId,action}=parsed.data;
  const c=await db.campaign.findUnique({where:{id:campaignId},select:{id:true,title:true}});
  if(!c)return NextResponse.json({error:"Сугалаа олдсонгүй."},{status:404});
  const data=action==="PUBLISH"?{status:"PUBLISHED",isActive:true}:action==="DRAFT"?{status:"DRAFT",isActive:false}:action==="ACTIVATE"?{isActive:true}:{isActive:false};
  const updated=await db.campaign.update({where:{id:campaignId},data});
  await db.adminAuditLog.create({data:{action:"CAMPAIGN_"+action,details:{campaignId,title:c.title}}});
  return NextResponse.json({ok:true,campaign:{id:updated.id,status:updated.status,isActive:updated.isActive}});
}