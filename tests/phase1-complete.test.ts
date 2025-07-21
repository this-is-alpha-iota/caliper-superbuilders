import { describe, test, expect } from 'bun:test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Phase 1 Complete: All Entity and Event Types', () => {
  test('validates OutcomeEvent', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      sendTime: '2018-11-15T10:15:00.000Z',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [{
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:fcd495d0-3740-4298-9bec-1154571dc211',
        type: 'OutcomeEvent',
        actor: {
          id: 'https://example.edu/users/554433',
          type: 'Person',
        },
        action: 'Graded',
        object: {
          id: 'https://example.edu/courses/7/sections/1',
          type: 'CourseSection',
        },
        generated: {
          id: 'https://example.edu/outcomes/1',
          type: 'Outcome',
          achievedLevel: 'Mastery',
          normalScore: 95,
        },
        eventTime: '2018-11-15T10:15:00.000Z',
      }],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });

  test('validates new entity types', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      sendTime: '2018-11-15T10:15:00.000Z',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [{
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        type: 'ViewEvent',
        actor: {
          id: 'https://example.edu/users/554433',
          type: 'Person',
        },
        action: 'Viewed',
        object: {
          id: 'https://example.edu/questions/1',
          type: 'DateTimeQuestion', // New entity type
          questionPosed: 'When did World War II end?',
        },
        eventTime: '2018-11-15T10:15:00.000Z',
        // Demonstrate Learner and Instructor in generated field
        generated: {
          id: 'https://example.edu/learners/1',
          type: 'Learner', // New entity type in generated field
          name: 'John Student',
        },
      }],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });

  test('validates SharedLink entity', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      sendTime: '2018-11-15T10:15:00.000Z',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [{
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        type: 'ResourceManagementEvent',
        actor: {
          id: 'https://example.edu/users/instructor',
          type: 'Person', // Actor must be Person, not Instructor subtype
        },
        action: 'Created',
        object: {
          id: 'https://example.edu/links/shared/1',
          type: 'SharedLink', // New entity type
          href: 'https://example.edu/resources/article',
          sharedWithAgents: [{
            id: 'https://example.edu/users/student1',
            type: 'Person',
          }],
        },
        eventTime: '2018-11-15T10:15:00.000Z',
      }],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });

  test('validates new response types', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      sendTime: '2018-11-15T10:15:00.000Z',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [{
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        type: 'AssessmentItemEvent',
        actor: {
          id: 'https://example.edu/users/554433',
          type: 'Person',
        },
        action: 'Completed',
        object: {
          id: 'https://example.edu/questions/open/1',
          type: 'OpenEndedQuestion', // New entity type
          questionPosed: 'Describe the causes of climate change.',
        },
        generated: {
          id: 'https://example.edu/responses/1',
          type: 'OpenEndedResponse', // New entity type
          value: 'Climate change is caused by...',
        },
        eventTime: '2018-11-15T10:15:00.000Z',
      }],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });

  test('validates CourseProgram and Scale entities', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      sendTime: '2018-11-15T10:15:00.000Z',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [{
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        type: 'FeedbackEvent',
        actor: {
          id: 'https://example.edu/users/554433',
          type: 'Person',
        },
        action: 'Rated',
        object: {
          id: 'https://example.edu/programs/cs',
          type: 'CourseProgram', // New entity type as object
          name: 'Computer Science',
          programCode: 'CS',
          academicLevel: 'undergraduate',
        },
        generated: {
          id: 'https://example.edu/ratings/1',
          type: 'Rating',
          value: 4,
          rated: {
            id: 'https://example.edu/scale/1',
            type: 'Scale', // New entity type  
            scaleMin: 1,
            scaleMax: 5,
            scaleStep: 1,
          },
        },
        eventTime: '2018-11-15T10:15:00.000Z',
      }],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.valid).toBe(true);
  });
}); 