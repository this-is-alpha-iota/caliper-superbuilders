import { describe, test, expect } from 'bun:test';
import { apiRequest, createEnvelope } from '../helpers/client';

describe('Entity Types Validation', () => {
  const endpoint = '/caliper/v1p2/events/validate';

  test('validates OutcomeEvent', async () => {
    const envelope = createEnvelope([{
      '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
      type: 'OutcomeEvent',
      actor: {
        id: 'https://example.edu/users/instructor',
        type: 'Person',
      },
      action: 'Graded',
      object: {
        id: 'https://example.edu/attempts/1',
        type: 'Attempt',
      },
      generated: {
        id: 'https://example.edu/outcomes/1',
        type: 'Outcome',
        resultScore: 85,
        maxResultScore: 100,
      },
      eventTime: '2018-11-15T10:15:00.000Z',
    }]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data?.valid).toBe(true);
  });

  test('validates DateTimeQuestion and DateTimeResponse', async () => {
    const envelope = createEnvelope([{
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
        type: 'DateTimeQuestion',
        questionPosed: 'When did World War II end?',
      },
      eventTime: '2018-11-15T10:15:00.000Z',
      generated: {
        id: 'https://example.edu/learners/1',
        type: 'Learner',
        name: 'John Student',
      },
    }]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data?.valid).toBe(true);
  });

  test('validates SharedLink entity', async () => {
    const envelope = createEnvelope([{
      '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
      type: 'AnnotationEvent',
      actor: {
        id: 'https://example.edu/users/instructor',
        type: 'Person',
      },
      action: 'Shared',
      object: {
        id: 'https://example.edu/sharedlinks/1',
        type: 'SharedLink',
        target: {
          id: 'https://example.edu/page/1',
          type: 'Page',
        },
      },
      eventTime: '2018-11-15T10:15:00.000Z',
    }]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data?.valid).toBe(true);
  });

  test('validates OpenEndedQuestion and OpenEndedResponse', async () => {
    const envelope = createEnvelope([{
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
        type: 'OpenEndedQuestion',
        questionPosed: 'Describe the causes of climate change.',
      },
      generated: {
        id: 'https://example.edu/responses/1',
        type: 'OpenEndedResponse',
        value: 'Climate change is caused by...',
      },
      eventTime: '2018-11-15T10:15:00.000Z',
    }]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data?.valid).toBe(true);
  });

  test('validates CourseProgram and Scale entities', async () => {
    const envelope = createEnvelope([{
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
        type: 'CourseProgram',
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
          type: 'Scale',
          scaleMin: 1,
          scaleMax: 5,
          scaleStep: 1,
        },
      },
      eventTime: '2018-11-15T10:15:00.000Z',
    }]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data?.valid).toBe(true);
  });
}); 