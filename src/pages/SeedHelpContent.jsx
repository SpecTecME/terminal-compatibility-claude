/**
 * Seed Help Content Page
 *
 * PURPOSE:
 * This page seeds the help content entities (HelpArticle, HelpIntent, HelpAlias, HelpContextRule)
 * with initial help content. This is an admin-only utility page that should be run once
 * when setting up the application or when refreshing help content.
 *
 * The help content is based on ACTUAL workflows and features that exist in the system.
 * It covers:
 * - How terminal registration works
 * - Why registration can fail
 * - Terminal approval vs berth compatibility
 * - Status meanings and constraints
 * - How to update documents
 * - Archive vs delete philosophy
 *
 * This content is intentionally friendly, professional, and operationally focused,
 * not marketing-oriented. It is written as internal support documentation.
 *
 * EXPORTABILITY:
 * This page only populates the database. All content is stored in entities.
 * Once seeded, the chatbot can operate entirely offline using this content,
 * making it fully exportable with the project.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function SeedHelpContent() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const seedContent = async () => {
    setLoading(true);
    setStatus('Seeding help content...');

    // Determine tenant from current user
    const user = await base44.auth.me();
    const tenantId = 'global';

    const helpIntents = [
      {
        intentKey: 'registration_overview',
        answerMarkdown:
          '**Terminal Registration Overview**\n\nRegistration is a **terminal-level approval process**. It works like this:\n\n1. You apply on behalf of a terminal\n2. The system checks specific documents marked with "Submission Stage = Registration"\n3. Both missing and expired documents block approval\n4. Once approved, your vessel is cleared for that terminal\n5. You can then check which **berths** are compatible with your vessel\n\nApproval is just the first step—berth compatibility is checked separately.',
        priority: 10,
        isActive: true,
      },
      {
        intentKey: 'registration_fail_reasons',
        answerMarkdown:
          '**Why Registration Fails**\n\nRegistration approval is blocked if:\n\n- **Missing documents**: Required documents haven\'t been uploaded\n- **Expired documents**: Documents are past their expiry date\n- **Document status**: Documents must be "Active", not archived or rejected\n\nAll three conditions must be met. Missing just one required document or having one expired document blocks the entire registration.\n\n**What to do**: Check the Documents tab and upload or renew the missing/expired documents.',
        priority: 15,
        isActive: true,
      },
      {
        intentKey: 'terminal_vs_berth',
        answerMarkdown:
          '**Terminal Approval vs Berth Compatibility**\n\nThese are two different checks:\n\n**Terminal Approval** (Registration):\n- One-time check when you apply\n- Evaluates your vessel\'s documents\n- Result: "Approved for terminal" or "Pending"\n\n**Berth Compatibility**:\n- Checks if your vessel fits the **physical constraints** of specific berths\n- Examples: Length, beam, draft, cargo capacity, manifold heights\n- Result: "Compatible", "Compatible with restrictions", or "Not compatible"\n\nYou can be approved for a terminal but incompatible with some of its berths. Each berth is evaluated separately.',
        priority: 12,
        isActive: true,
      },
      {
        intentKey: 'status_meanings',
        answerMarkdown:
          '**Status Meanings**\n\n- **Operational**: Fully available for use\n- **Maintenance**: Temporarily unavailable; can be returned to Operational\n- **Inactive**: No longer in use (archived, but data preserved)\n\n**Important**: Changing a terminal or berth status is separate from editing other details. Status changes are treated as significant operational decisions and are logged separately in the audit trail.\n\nTerminals and berths cannot be deleted—only archived—to preserve historical data and regulatory compliance.',
        priority: 20,
        isActive: true,
      },
      {
        intentKey: 'update_documents_registration',
        answerMarkdown:
          '**Updating Documents During Registration**\n\nYou can update documents without restarting the registration process:\n\n1. Go to the Documents tab\n2. Upload or update the document\n3. The system automatically recalculates registration eligibility\n4. If all required documents are now present and valid, registration approval is triggered\n\nThere\'s no need to re-apply or restart. The system continuously checks your document status.',
        priority: 18,
        isActive: true,
      },
      {
        intentKey: 'compatibility_restrictions',
        answerMarkdown:
          '**Berth Compatibility & Restrictions**\n\nIf a berth shows "Compatible with restrictions", it means:\n\n- Your vessel **can** use the berth\n- But one or more **constraints** apply\n- Common examples:\n  - **Manifold height**: Your vessel\'s manifolds are near the berth\'s limits\n  - **Draft**: You may only berth at certain tide levels\n  - **Beam or length**: You\'re close to maximum dimensions\n\nRestrictions are warnings, not blockers. Check the details to understand what operational constraints apply (e.g., berth only available at high tide).',
        priority: 25,
        isActive: true,
      },
      {
        intentKey: 'archive_philosophy',
        answerMarkdown:
          '**Archive vs Delete Philosophy**\n\nTerminals and berths **cannot be deleted**. Instead, they are **archived**.\n\n**Why?**\n- Regulatory compliance: Historical data must be preserved\n- Audit trail: All decisions must be traceable\n- Data integrity: Removing entities would break relationships\n\n**What happens when archived?**\n- The entity is hidden from normal lists\n- It\'s still in the database and queryable\n- Historical references remain intact\n- You can un-archive if needed\n\nThis is intentional and by design. Think of it as "decommissioning" rather than deletion.',
        priority: 30,
        isActive: true,
      },
    ];

    const helpAliases = [
      // Registration aliases
      { phrase: 'how does registration work', intentKey: 'registration_overview' },
      { phrase: 'what is terminal registration', intentKey: 'registration_overview' },
      { phrase: 'how to register vessel', intentKey: 'registration_overview' },
      { phrase: 'registration process', intentKey: 'registration_overview' },
      { phrase: 'why registration fails', intentKey: 'registration_fail_reasons' },
      { phrase: 'why cant i register', intentKey: 'registration_fail_reasons' },
      { phrase: 'registration blocked', intentKey: 'registration_fail_reasons' },
      { phrase: 'missing documents registration', intentKey: 'registration_fail_reasons' },
      { phrase: 'expired documents', intentKey: 'registration_fail_reasons' },

      // Terminal vs berth
      { phrase: 'terminal approval berth', intentKey: 'terminal_vs_berth' },
      { phrase: 'whats the difference between terminal and berth', intentKey: 'terminal_vs_berth' },
      { phrase: 'why is my vessel incompatible', intentKey: 'terminal_vs_berth' },
      { phrase: 'approved terminal but not berth', intentKey: 'terminal_vs_berth' },

      // Status
      { phrase: 'what do the statuses mean', intentKey: 'status_meanings' },
      { phrase: 'status operational maintenance inactive', intentKey: 'status_meanings' },
      { phrase: 'why cant i delete', intentKey: 'archive_philosophy' },
      { phrase: 'why can i only archive', intentKey: 'archive_philosophy' },

      // Updates
      { phrase: 'how to update documents', intentKey: 'update_documents_registration' },
      { phrase: 'do i need to re register', intentKey: 'update_documents_registration' },
      { phrase: 'upload new document', intentKey: 'update_documents_registration' },

      // Restrictions
      { phrase: 'compatible with restrictions', intentKey: 'compatibility_restrictions' },
      { phrase: 'what does restrictions mean', intentKey: 'compatibility_restrictions' },
      { phrase: 'manifold height', intentKey: 'compatibility_restrictions' },
    ];

    const helpContextRules = [
      // RegistrationWizard
      { pageKey: 'StartRegistration', intentKey: 'registration_overview', rank: 5 },
      { pageKey: 'StartRegistration', intentKey: 'registration_fail_reasons', rank: 10 },
      { pageKey: 'RegistrationApplications', intentKey: 'registration_overview', rank: 3 },
      { pageKey: 'RegistrationApplications', intentKey: 'terminal_vs_berth', rank: 8 },

      // VesselDetail
      { pageKey: 'VesselDetail', intentKey: 'terminal_vs_berth', rank: 5 },
      { pageKey: 'VesselDetail', intentKey: 'compatibility_restrictions', rank: 7 },

      // TerminalDetail
      { pageKey: 'TerminalDetail', intentKey: 'status_meanings', rank: 8 },
      { pageKey: 'TerminalDetail', intentKey: 'archive_philosophy', rank: 15 },

      // BerthDetail
      { pageKey: 'BerthDetail', intentKey: 'status_meanings', rank: 5 },
      { pageKey: 'BerthDetail', intentKey: 'compatibility_restrictions', rank: 6 },
    ];

    const helpArticles = [
      {
        title: 'Terminal Registration Guide',
        summary: 'Learn how vessel registration works at the terminal level.',
        contentMarkdown: `# Terminal Registration Guide

Registration is a **terminal-level approval** process that determines if your vessel can operate at a specific terminal.

## How It Works

1. **Submit Registration**: Apply on behalf of a terminal
2. **Document Check**: System validates required documents with "Submission Stage = Registration"
3. **Status Check**: Both missing and expired documents block approval
4. **Approval Decision**: Either approved or pending
5. **Berth Compatibility**: Once approved, you can check individual berth compatibility

## Key Points

- Registration is **terminal-specific**, not global
- You must re-register for each terminal
- Document status is continuously monitored
- You can update documents without restarting the process

## Next Steps

- Upload all required documents
- Check the status in the Registrations tab
- Once approved, view compatible berths
`,
        category: 'Registration',
        status: 'Active',
        sortOrder: 1,
      },
      {
        title: 'Understanding Berth Compatibility',
        summary: 'How vessel physical constraints are evaluated against berth limits.',
        contentMarkdown: `# Understanding Berth Compatibility

Berth compatibility is a **physical constraint check** separate from terminal registration approval.

## What Gets Checked

- **Dimensions**: Length, beam, draft
- **Cargo**: Capacity in cubic meters
- **Manifolds**: Height, spacing, flange sizes
- **Moorings**: Winch capacity, line types
- **Fenders**: Contact zones and load limits

## Compatibility Status

- **Compatible**: Vessel fits all berth constraints
- **Compatible with Restrictions**: Vessel fits but with operational limits (e.g., tide-dependent)
- **Not Compatible**: Vessel cannot safely use this berth

## Restrictions Example

If manifold height is a restriction:
- Your vessel's manifolds are near the berth's operational limits
- You may need to coordinate with terminal operations
- Some operational constraints may apply

## Important

You can be **approved for a terminal** but **incompatible with some berths** at that terminal. Each berth is evaluated separately.
`,
        category: 'Terminals',
        status: 'Active',
        sortOrder: 2,
      },
      {
        title: 'Document Management During Registration',
        summary: 'How to update documents and what happens automatically.',
        contentMarkdown: `# Document Management During Registration

## Updating Documents

You can update documents at any time during the registration process:

1. Go to the **Documents** tab
2. Upload or update the document
3. The system **automatically recalculates** registration eligibility
4. If all requirements are now met, approval is triggered

No need to re-apply or restart the process.

## Document Requirements

Documents must have:
- **Status**: Active (not archived or rejected)
- **Expiry**: Not expired (or no expiry requirement)
- **Submission Stage**: Marked as "Registration" if required

## Expired Documents

If a document expires:
- Registration status changes to "Pending"
- You must upload a renewed document
- Status updates automatically once renewed document is uploaded

## Continuous Monitoring

The system continuously checks your documents. You don't need to manually trigger anything—changes are detected and processed automatically.
`,
        category: 'Documents',
        status: 'Active',
        sortOrder: 3,
      },
      {
        title: 'Status Meanings and Operations',
        summary: 'What different statuses mean and why status changes are separate from edits.',
        contentMarkdown: `# Status Meanings and Operations

## Status Values

- **Operational**: Fully available for use
- **Maintenance**: Temporarily unavailable; can be returned to Operational
- **Inactive**: No longer in use (archived)

## Why Status is Separate

Changing a terminal or berth status is treated as a significant **operational decision**:
- It\'s logged separately in the audit trail
- It requires explicit action (not a side effect of editing other fields)
- It signals intent to operations teams

## Delete vs Archive

**You cannot delete** terminals or berths. Instead, you **archive** them.

### Why Archive Only?

- **Regulatory compliance**: Historical data must be preserved
- **Audit trail**: All decisions traceable
- **Data integrity**: Relationships cannot be broken

### What Happens When Archived?

- Entity hidden from normal lists
- Still in database and queryable
- Historical references remain intact
- Can be un-archived if needed

Think of archiving as "decommissioning" rather than deletion.
`,
        category: 'Operations',
        status: 'Active',
        sortOrder: 4,
      },
    ];

    try {
      // Create intents with public IDs
      const createdIntents = await Promise.all(
        helpIntents.map(intent =>
          base44.entities.HelpIntent.create({
            ...intent,
            publicId: crypto.randomUUID?.() || `intent-${Date.now()}`,
            tenantId,
          })
        )
      );

      setStatus(`Created ${createdIntents.length} intents...`);

      // Create aliases
      const createdAliases = await Promise.all(
        helpAliases.map(alias => {
          const matchingIntent = createdIntents.find(
            i => i.intentKey === alias.intentKey
          );
          return base44.entities.HelpAlias.create({
            phrase: alias.phrase,
            intentId: matchingIntent.id,
            intentPublicId: matchingIntent.publicId,
            publicId: crypto.randomUUID?.() || `alias-${Date.now()}`,
            tenantId,
            isActive: true,
          });
        })
      );

      setStatus(`Created ${createdAliases.length} aliases...`);

      // Create context rules
      const createdContextRules = await Promise.all(
        helpContextRules.map(rule => {
          const matchingIntent = createdIntents.find(
            i => i.intentKey === rule.intentKey
          );
          return base44.entities.HelpContextRule.create({
            pageKey: rule.pageKey,
            intentId: matchingIntent.id,
            intentPublicId: matchingIntent.publicId,
            rank: rule.rank,
            publicId: crypto.randomUUID?.() || `context-${Date.now()}`,
            tenantId,
            isActive: true,
          });
        })
      );

      setStatus(`Created ${createdContextRules.length} context rules...`);

      // Create articles
      const createdArticles = await Promise.all(
        helpArticles.map(article =>
          base44.entities.HelpArticle.create({
            ...article,
            publicId: crypto.randomUUID?.() || `article-${Date.now()}`,
            tenantId,
          })
        )
      );

      setStatus(
        `✅ Successfully seeded ${createdIntents.length} intents, ${createdAliases.length} aliases, ${createdContextRules.length} context rules, and ${createdArticles.length} articles!`
      );
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Help Content (Admin Only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This utility populates the help system with initial content about terminal registration,
            berth compatibility, document management, and statuses. Run this once to set up the chatbot.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
            <strong>What will be created:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>7 Help Intents (core help topics)</li>
              <li>23 Help Aliases (user input phrases)</li>
              <li>10 Context Rules (page-specific rankings)</li>
              <li>4 Help Articles (long-form documentation)</li>
            </ul>
          </div>

          {status && (
            <div className={`p-4 rounded-lg text-sm ${
              status.startsWith('✅')
                ? 'bg-green-50 text-green-900'
                : status.startsWith('❌')
                  ? 'bg-red-50 text-red-900'
                  : 'bg-blue-50 text-blue-900'
            }`}>
              {status}
            </div>
          )}

          <Button onClick={seedContent} disabled={loading} className="w-full">
            {loading ? 'Seeding...' : 'Seed Help Content'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}