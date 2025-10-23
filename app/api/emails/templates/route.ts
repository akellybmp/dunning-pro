import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplates, saveEmailTemplate, deleteEmailTemplate } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const templates = await getEmailTemplates(companyId);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, template } = await request.json();

    if (!companyId || !template) {
      return NextResponse.json(
        { error: 'Company ID and template are required' },
        { status: 400 }
      );
    }

    const savedTemplate = await saveEmailTemplate(companyId, template);
    return NextResponse.json({ template: savedTemplate });
  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await deleteEmailTemplate(templateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
