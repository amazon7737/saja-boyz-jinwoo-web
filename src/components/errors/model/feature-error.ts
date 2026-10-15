type FeatureErrorReason = 'network' | 'configuration' | 'invalid-response';

export const featureErrorMessages: Record<FeatureErrorReason, string> = {
  network: '연결을 확인해 주세요.',
  configuration: '서비스 설정을 확인해 주세요.',
  'invalid-response': '응답을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.',
};

export class FeatureError extends Error {
  constructor(public readonly reason: FeatureErrorReason) {
    super(reason);
    this.name = 'FeatureError';
  }
}
