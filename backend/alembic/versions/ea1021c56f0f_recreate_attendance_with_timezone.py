"""recreate_attendance_with_timezone

Revision ID: ea1021c56f0f
Revises: 6494c6dbbaa6
Create Date: 2026-04-08 11:33:27.739656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ea1021c56f0f'
down_revision: Union[str, Sequence[str], None] = '6494c6dbbaa6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('attendance',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('member_id', sa.Integer(), nullable=False),
    sa.Column('subscription_id', sa.Integer(), nullable=True),
    sa.Column('check_in_time', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('check_out_time', postgresql.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
    sa.Column('duration_minutes', sa.Integer(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_id'), 'attendance', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_attendance_id'), table_name='attendance')
    op.drop_table('attendance')