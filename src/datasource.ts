import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { AxiomQuery, AxiomDataSourceOptions } from './types';

export class DataSource extends DataSourceWithBackend<AxiomQuery, AxiomDataSourceOptions> {
  url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<AxiomDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url;
  }

  applyTemplateVariables(query: AxiomQuery) {
    const templateSrv = getTemplateSrv();
    return {
      ...query,
      apl: query.apl ? templateSrv.replace(query.apl) : '',
    };
  }

  async lookupSchema() {
    const schemaQuery: AxiomQuery = {
      apl: "",
      totals: false,
      refId: "a",
      queryType: "schemaLookup"
    };
    const request = {
      targets: [
        {
          ...schemaQuery,
          refId: 'metricFindQuery',
        },
      ],
    } as DataQueryRequest<AxiomQuery>;

    let res: DataQueryResponse | undefined;

    try {
      res = await this.query(request).toPromise();
    } catch (err) {
      return Promise.reject(err);
    }

    if (res && (!res.data.length || !res.data[0].fields.length)) {
      return [];
    }

    return res ? res.data[0].fields[0].values.buffer : {};
  }

  async metricFindQuery(query: AxiomQuery, options?: any) {
    const request = {
      targets: [
        {
          ...query,
          refId: 'metricFindQuery',
        },
      ],
      range: options.range,
      rangeRaw: options.rangeRaw,
    } as DataQueryRequest<AxiomQuery>;

    let res: DataQueryResponse | undefined;

    try {
      res = await this.query(request).toPromise();
    } catch (err) {
      return Promise.reject(err);
    }

    if (res && (!res.data.length || !res.data[0].fields.length)) {
      return [];
    }

    return res ? (res.data[0] as DataFrame).fields[0].values.toArray().map((_) => ({ text: _.toString() })) : [];
  }

}
