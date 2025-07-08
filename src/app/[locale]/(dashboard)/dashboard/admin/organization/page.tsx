/**
 * Organization Admin Management Page
 * TSA-46: Organization profile editing, billing, features, and settings
 */

import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { canAccessOrganizationManagement } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  CreditCard,
  Settings,
  Users,
  Crown,
  Shield,
  Mail,
  MapPin,
} from 'lucide-react';
// import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { OrganizationSettingsForm } from '@/components/admin/organization-settings-form';

export default async function AdminOrganizationPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Check permissions
  if (!canAccessOrganizationManagement(dbUser)) {
    redirect('/dashboard');
  }

  // const t = await getTranslations('admin.organization');

  // Fetch organization details (fresh query to ensure latest data)
  const organization = await prisma.organization.findUnique({
    where: { id: dbUser.organizationId },
    include: {
      users: {
        select: { id: true, isActive: true, role: true },
      },
      teams: {
        select: { id: true, isActive: true },
        where: { isActive: true },
      },
    },
  });

  if (!organization) {
    redirect('/dashboard');
  }

  // Calculate statistics
  // const totalUsers = organization.users.length;
  const activeUsers = organization.users.filter((u) => u.isActive).length;
  const totalTeams = organization.teams.length;
  const adminUsers = organization.users.filter((u) => u.role === 'ADMIN').length;

  const usagePercentage =
    organization.maxUsers && organization.maxUsers > 0
      ? Math.round((activeUsers / organization.maxUsers) * 100)
      : 0;

  const planColors = {
    FREE: 'bg-gray-100 text-gray-800',
    STARTER: 'bg-blue-100 text-blue-800',
    PROFESSIONAL: 'bg-purple-100 text-purple-800',
    ENTERPRISE: 'bg-gold-100 text-gold-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Building className="h-8 w-8" />
            Organization Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage organization settings, billing, and configuration
          </p>
        </div>
      </div>

      {/* Organization Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Type</CardTitle>
            <Crown className="text-gold-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.planType}</div>
            <Badge variant="secondary" className={planColors[organization.planType]}>
              {organization.planType}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeUsers}/{organization.maxUsers || '∞'}
            </div>
            <p className="text-xs text-muted-foreground">
              {organization.maxUsers ? `${usagePercentage}% of limit` : 'Unlimited'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">Active teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Administrator users</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>Basic organization details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
              <p className="text-lg font-semibold">{organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Slug</label>
              <p className="rounded bg-muted px-2 py-1 font-mono text-sm">{organization.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{organization.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-sm">{organization.updatedAt.toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
            <CardDescription>Billing and subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Billing Email</label>
              <p className="flex items-center gap-2 text-sm">
                {organization.billingEmail ? (
                  <>
                    <Mail className="h-4 w-4" />
                    {organization.billingEmail}
                  </>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Plan Expires</label>
              <p className="text-sm">
                {organization.planExpiredAt
                  ? organization.planExpiredAt.toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User Limit</label>
              <p className="text-sm">
                {organization.maxUsers ? `${organization.maxUsers} users` : 'Unlimited'}
              </p>
            </div>
            {organization.billingAddress && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing Address</label>
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>
                    {/* Address formatting would go here */}
                    Address configured
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enabled Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enabled Features
          </CardTitle>
          <CardDescription>Features available for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          {organization.enabledFeatures && organization.enabledFeatures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {organization.enabledFeatures.map((feature) => (
                <Badge key={feature} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No special features enabled</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Organization Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Update organization information, billing, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm organization={organization} isAdmin={dbUser.role === 'ADMIN'} />
        </CardContent>
      </Card>
    </div>
  );
}
