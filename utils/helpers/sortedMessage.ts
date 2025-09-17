import dayjs from "dayjs";

interface Message {
  id: string;
  text: string;
  time: Date;
  isSent: boolean;
  status: "sent" | "delivered" | "seen";
  avatar?: string;
  sender?: string;
}

export interface GroupedMessages {
  date: string;
  label: string;
  messages: Message[];
}

export function groupAndSortMessages(messages: Message[]): GroupedMessages[] {
  const grouped = messages.reduce(
    (acc, msg) => {
      const dateKey = dayjs(msg?.time).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(msg);
      return acc;
    },
    {} as Record<string, Message[]>
  );

  return Object.entries(grouped)
    .map(([date, msgs]) => {
      const day = dayjs(date);
      const label = day.isSame(dayjs(), "day")
        ? "Today"
        : day.isSame(dayjs().subtract(1, "day"), "day")
          ? "Yesterday"
          : day.format("DD MMM YYYY");

      return {
        date,
        label,
        messages: msgs.sort(
          (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf()
        ),
      };
    })
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()); // oldest → newest
}
