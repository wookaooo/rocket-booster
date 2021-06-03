import { selectUpstream } from './load-balancing';
import { getFirewallResponse } from './firewall';
import { setRequestHeaders, setResponseHeaders } from './headers';
import { getUpstreamResponse } from './upstream';
import { getCORSResponse } from './cors';
import { getErrorResponse } from './error';
import { Configuration } from './types';

class RocketBooster {
  config: Configuration;

  constructor(config: Configuration) {
    this.config = config;
  }

  async apply(request: Request): Promise<Response | null> {
    const firewallResponse = getFirewallResponse(
      request,
      this.config.firewall,
    );
    if (firewallResponse !== null) {
      return firewallResponse;
    }

    setRequestHeaders(
      request,
      this.config.header,
    );
    const upstream = selectUpstream(
      this.config.upstream,
      this.config.loadBalancing,
    );
    const upstreamResponse = await getUpstreamResponse(
      request,
      upstream,
      this.config.optimization,
    );

    const errorResponse = await getErrorResponse(
      upstreamResponse,
      upstream,
      this.config.error,
    );

    const corsResponse = getCORSResponse(
      request,
      errorResponse,
      this.config.cors,
    );

    const headersResponse = setResponseHeaders(
      corsResponse,
      this.config.header,
    );
    return headersResponse;
  }
}

export default RocketBooster;
