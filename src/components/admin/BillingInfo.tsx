'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Receipt, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  unitPrice: number;
  currency: string;
  billingInterval: string;
  paymentMethod?: string;
  nextPaymentDate?: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
}

interface BillingData {
  subscription: Subscription | null;
  invoices: Invoice[];
}

export default function BillingInfo() {
  const t = useTranslations('admin.billing');
  const { toast } = useToast();
  const [billingData, setBillingData] = useState<BillingData>({ subscription: null, invoices: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [selectedInterval, setSelectedInterval] = useState('monthly');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/admin/billing');
      if (response.ok) {
        const data = await response.json();
        setBillingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (action: string, data?: any) => {
    try {
      const response = await fetch('/api/admin/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (response.ok) {
        await fetchBillingData();
        toast({
          title: t('subscription.success'),
          description: t(`subscription.${action}Success`),
        });
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      toast({
        title: t('subscription.error'),
        description: t('subscription.errorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubscription = async () => {
    try {
      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          billingInterval: selectedInterval.toUpperCase(),
        }),
      });

      if (response.ok) {
        await fetchBillingData();
        toast({
          title: t('subscription.created'),
          description: t('subscription.createdDesc'),
        });
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      toast({
        title: t('subscription.error'),
        description: t('subscription.errorDesc'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, icon: CheckCircle },
      CANCELED: { variant: 'destructive' as const, icon: XCircle },
      PAST_DUE: { variant: 'destructive' as const, icon: AlertCircle },
      TRIALING: { variant: 'secondary' as const, icon: Calendar },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {t(`status.${status.toLowerCase()}`)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>{t('title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subscription">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subscription">{t('tabs.subscription')}</TabsTrigger>
              <TabsTrigger value="invoices">{t('tabs.invoices')}</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-4">
              {billingData.subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">{t('subscription.currentPlan')}</h3>
                      <p className="text-lg font-semibold capitalize">{billingData.subscription.planId}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">{t('subscription.status')}</h3>
                      {getStatusBadge(billingData.subscription.status)}
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">{t('subscription.billing')}</h3>
                      <p className="text-lg font-semibold">
                        {formatCurrency(billingData.subscription.unitPrice, billingData.subscription.currency)}
                        <span className="text-sm text-gray-500 ml-1">
                          / {t(`interval.${billingData.subscription.billingInterval.toLowerCase()}`)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">{t('subscription.currentPeriod')}</h3>
                      <p className="text-gray-600">
                        {formatDate(billingData.subscription.currentPeriodStart)} - {formatDate(billingData.subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    {billingData.subscription.nextPaymentDate && (
                      <div>
                        <h3 className="font-medium mb-2">{t('subscription.nextPayment')}</h3>
                        <p className="text-gray-600">{formatDate(billingData.subscription.nextPaymentDate)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {billingData.subscription.cancelAtPeriodEnd ? (
                      <Button
                        onClick={() => handleSubscriptionAction('reactivate')}
                        variant="default"
                      >
                        {t('subscription.reactivate')}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscriptionAction('cancel')}
                        variant="destructive"
                      >
                        {t('subscription.cancel')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">{t('subscription.noActive')}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('subscription.selectPlan')}</label>
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">{t('plans.basic')}</SelectItem>
                          <SelectItem value="pro">{t('plans.pro')}</SelectItem>
                          <SelectItem value="enterprise">{t('plans.enterprise')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t('subscription.billingInterval')}</label>
                      <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">{t('interval.monthly')}</SelectItem>
                          <SelectItem value="yearly">{t('interval.yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateSubscription}>
                    {t('subscription.create')}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('invoices.title')}</h3>
                <Receipt className="h-5 w-5 text-gray-500" />
              </div>

              {billingData.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoices.number')}</TableHead>
                      <TableHead>{t('invoices.date')}</TableHead>
                      <TableHead>{t('invoices.amount')}</TableHead>
                      <TableHead>{t('invoices.status')}</TableHead>
                      <TableHead>{t('invoices.dueDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                        <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-600 text-center py-8">{t('invoices.noInvoices')}</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}