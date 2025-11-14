import Link from 'next/link';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TaminotchiDashboardPage = () => {
  return (
    <DashboardLayout role="taminotchi">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mahsulotlar</CardTitle>
            <CardDescription>
              Yangi mahsulot qo‘shing yoki mavjud mahsulotlaringizni tahrirlang. Tasdiqlash jarayonini kuzatib boring.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard/taminotchi/products/new">Yangi mahsulot</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/taminotchi/products">Mahsulotlar ro‘yxati</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Oqim va buyurtmalar</CardTitle>
            <CardDescription>
              Tasdiqlangan mahsulotlaringiz oqimlari va buyurtmalarining holatini kuzatib boring.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/dashboard/taminotchi/orders">Buyurtmalarim</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/taminotchi/payments">Hisob-kitoblar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TaminotchiDashboardPage;
