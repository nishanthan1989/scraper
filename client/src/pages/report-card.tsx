import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportCardProps {
  title: string;
  value: string | number;
  description: string;
  chart?: React.ReactNode;
}

export function ReportCard({ title, value, description, chart }: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{value}</div>
        {chart}
      </CardContent>
    </Card>
  );
}
