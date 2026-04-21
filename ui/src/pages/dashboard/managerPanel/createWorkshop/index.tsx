import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { CreateWorkshopForm } from './components';
import { Trans } from '@/components/Trans';

const CreateWorkshopPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/managerShopPanel" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <Trans translationKey="common.backToDashboard" text="Back to Dashboard" />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Plus className="h-8 w-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-foreground">
            <Trans translationKey="workshop.create.title" text="Create New Workshop" />
          </h1>
        </div>
        <p className="text-muted-foreground">
          <Trans 
            translationKey="workshop.create.description" 
            text="Add a new workshop to your management portfolio. Fill in the details below and select the location on the map." 
          />
        </p>
      </div>

      {/* Workshop Creation Form */}
      <CreateWorkshopForm />
    </div>
  );
};

export default CreateWorkshopPage;
