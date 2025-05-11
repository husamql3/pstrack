import { db } from '@/prisma/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { GiLaurelCrown, GiQueenCrown } from 'react-icons/gi';
import { cache } from 'react';
import { cn } from '@/utils/cn';

const getTopUsers = cache(async (groupNo: number) => {
  return await db.leetcoders.findMany({
    where: {
      status: 'APPROVED',
      group_no: groupNo,
      submissions: {
        some: {
          solved: true,
        },
      },
    },
    include: {
      submissions: {
        where: {
          solved: true,
        },
      },
    },
    orderBy: {
      submissions: {
        _count: 'desc',
      },
    },
    take: 3,
  });
});

const BadgeBackgroundShine = ({ text, position }: { text: string; position: number }) => {
  const getBadgeColors = () => {
    switch (position) {
      case 1:
        return "bg-[linear-gradient(110deg,#FFD700,45%,#FFF8B8,55%,#FFD700)] text-black";
      case 2:
        return "bg-[linear-gradient(110deg,#C0C0C0,45%,#E8E8E8,55%,#C0C0C0)] text-black";
      case 3:
        return "bg-[linear-gradient(110deg,#CD7F32,45%,#E8B27D,55%,#CD7F32)] text-black";
      default:
        return "bg-[linear-gradient(110deg,#000103,45%,#303030,55%,#000103)] text-neutral-200 dark:text-neutral-400";
    }
  };

  return (
    <div
      className={cn(
        "animate-shine items-center justify-center rounded-full border font-medium transition-colors",
        "bg-[length:400%_100%] aspect-square flex items-center justify-center w-6 h-6 text-xs",
        getBadgeColors(),
        position === 1 ? "border-yellow-400" : 
        position === 2 ? "border-gray-300" : 
        position === 3 ? "border-amber-700" : "border-white/10"
      )}
    >
      {text}
    </div>
  );
}

const Page = async () => {
  const groupNo = 1;
  const topUsers = await getTopUsers(groupNo);

  console.log(topUsers);

  return (
    <div className="mx-auto h-screen flex flex-col items-center justify-center max-w-sm text-white p-4">
      <div className="flex gap-5 mx-auto w-full items-end">
        {topUsers[1] && (
          <div className="flex flex-col items-center relative mb-4">
            <div className="relative">
              <Avatar className="size-24 border-2 border-gray-300">
                <AvatarImage src={topUsers[1].avatar || ''} alt={topUsers[1].username} />
              </Avatar>
              <div className="absolute -top-2 -right-2">
                <BadgeBackgroundShine text="2" position={2} />
              </div>
            </div>
            <p>@{topUsers[1].username}</p>
          </div>
        )}

        {topUsers[0] && (
          <div className="flex flex-col items-center relative mb-8">
            <div className="relative">
              <Avatar className="size-28 border-2 border-yellow-400">
                <AvatarImage src={topUsers[0].avatar || ''} alt={topUsers[0].username} />
              </Avatar>
              <div className="absolute top-0 right-0">
                <BadgeBackgroundShine text="1" position={1} />
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <GiLaurelCrown className="text-yellow-400 text-2xl" />
              </div>
            </div>
            <p className="font-bold">@{topUsers[0].username}</p>
          </div>
        )}

        {topUsers[2] && (
          <div className="flex flex-col items-center relative">
            <div className="relative">
              <Avatar className="size-20 border-2 border-amber-700">
                <AvatarImage src={topUsers[2].avatar || ''} alt={topUsers[2].username} />
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <BadgeBackgroundShine text="3" position={3} />
              </div>
            </div>
            <p>@{topUsers[2].username}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;