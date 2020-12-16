import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import _ from 'lodash';
import { AreaMap } from './Map';

/**
 * 
 * @param param0 
 */
export const MapSelection: React.FC<{
  readonly value?: string;
  readonly values?: AreaMap[];
  readonly onSelect?: (value: string) => void;
}> = ({ value, values = [], onSelect }) => {

  const onClick = (value: string) => () => {
    if (!!onSelect) {
      onSelect(value);
    }
  };

  return (
    <Card style={{ width: '18rem' }}>
      <Card.Header>Map</Card.Header>
      <ListGroup variant="flush">
        {_.map(values, map => {
          return (
            <ListGroup.Item key={map.id}
              eventKey={map.id}
              active={value === map.id}
              action onClick={onClick(map.id)}>
              {map.descr}
            </ListGroup.Item>
          );
        })
        }
      </ListGroup>
    </Card>
  );
}
