import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import _ from 'lodash';
import { Level } from './Level';

/**
 * 
 */
export const LevelSelection: React.FC<{
  readonly value?: string,
  readonly values?: Level[],
  readonly onSelect?: (value: string) => void
}> = ({ value, values = [], onSelect }) => {

  const listOnSelect = (value: string) => () => {
    if (!!onSelect) {
      onSelect(value);
    }
  }

  return (
    <Card style={{ width: '18rem' }}>
      <Card.Header>Game Level</Card.Header>
      <ListGroup variant="flush">
        {_.map(values, level =>
          (
            <ListGroup.Item action key={level.id}
              active={!!value && value === level.id}
              eventKey={level.id}
              onClick={listOnSelect(level.id)}>{level.name}</ListGroup.Item>
          )
        )}
      </ListGroup>
    </Card>
  );
}
